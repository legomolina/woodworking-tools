import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { testTool as testEntry } from '../../../testing/test-tool/test-tool';
import { TestToolPage } from '../../../testing/test-tool/test-tool.page';
import { toolRoutes } from './tool-routes';

describe('toolRoutes', () => {
  it('serves a registered Tool at /<path>', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(toolRoutes([testEntry()]))] });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/test-tool');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Test Tool');
  });

  it("loads a Tool's routes only when its page is visited", async () => {
    const loadRoutes = vi.fn(async () => Promise.resolve([{ path: '', component: TestToolPage }]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '', children: [] }, ...toolRoutes([testEntry({ loadRoutes })])]),
      ],
    });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/');
    expect(loadRoutes).not.toHaveBeenCalled();

    await harness.navigateByUrl('/test-tool');
    expect(loadRoutes).toHaveBeenCalledOnce();
  });

  it.each(['TestTool', 'test_tool', '/test-tool', 'test--tool', '-test-tool', 'test-tool-', ''])(
    'rejects %j as a Tool path, which must be kebab-case',
    (path) => {
      expect(() => toolRoutes([testEntry({ path })])).toThrow(/kebab-case/);
    },
  );

  it.each(['unit-converter', 'tool2', 'a2-b', 'x'])('accepts %j as a Tool path', (path) => {
    expect(toolRoutes([testEntry({ path })])).toEqual([expect.objectContaining({ path })]);
  });

  it("titles a Tool's route with the Tool's name key, so the page title names the Tool", () => {
    expect(toolRoutes([testEntry()])).toEqual([
      expect.objectContaining({ path: 'test-tool', title: 'tools.testTool.name' }),
    ]);
  });

  it('rejects two Tools at the same path', () => {
    expect(() => toolRoutes([testEntry(), testEntry()])).toThrow(
      'Two Tools are registered at the path "test-tool".',
    );
  });
});
