# Woodworking Tools

Client-side calculators and utilities for hobbyist and small-shop woodworkers who work with store-bought boards and sheet goods.

## Language

### Tools

**Tool**:
A standalone calculator or utility that solves one woodworking task and lives on its own page.
_Avoid_: App, module, feature, widget
_Spanish_: Herramienta

**Unit Converter**:
The tool that converts a measurement between units and unit systems.
_Avoid_: Unit calculator, converter
_Spanish_: Conversor de unidades

**Cut Optimizer**:
The tool that plans how to cut the required pieces out of the available stock while minimizing waste. It currently does **linear (1D) optimization only**: Stock and Parts are defined by their length. Two-dimensional optimization for sheet goods is planned but out of scope for now.
_Avoid_: Cut list optimizer, nesting tool
_Spanish_: Optimizador de cortes

### Measurement

**Unit System**:
A family of units for expressing measurements: either Metric or Imperial.
_Avoid_: Measurement system, standard
_Spanish_: Sistema de medida

**Metric**:
The unit system based on millimetres, centimetres and metres.
_Avoid_: SI, decimal
_Spanish_: Métrico

**Imperial**:
The unit system based on inches and feet, where lengths are commonly written with fractional inches (`3 1/2"`) or in feet and inches (`6' 4 1/4"`).
_Avoid_: US customary, English units
_Spanish_: Imperial

### Cut Optimizer

**Cut List**:
The Parts required for a job, each with its length, quantity and optional name.
_Avoid_: Parts list, bill of materials, using "cut list" for the result
_Spanish_: Lista de piezas

**Cutting Plan**:
The result of an optimization: which Parts come out of each Stock and in what order, plus the resulting Offcuts, Waste and Unplaced Parts.
_Avoid_: Cut list, layout, solution, result
_Spanish_: Plan de corte

**Strategy**:
An optimization criterion the Cut Optimizer can use to build a Cutting Plan, such as using the fewest Stock.
_Avoid_: Optimizer, algorithm, mode
_Spanish_: Estrategia

**Unplaced Part**:
A Part that could not be fitted into any available Stock and is reported to the user as missing from the Cutting Plan.
_Avoid_: Failed part, leftover part, error
_Spanish_: Pieza sin colocar

**Stock**:
A length of material available to be cut, such as a board or batten, either bought in a standard length or left over in the shop.
_Avoid_: Board, bar, material, lumber
_Spanish_: Material

**Part**:
A piece of a required length that must be obtained by cutting Stock.
_Avoid_: Piece, cut, component
_Spanish_: Pieza

**Cut**:
A single pass of the saw through a Stock.
_Avoid_: Using "cut" to mean a Part
_Spanish_: Corte

**Kerf**:
The width of material removed and lost in every Cut.
_Avoid_: Blade thickness, saw width
_Spanish_: Grosor de corte

**Trim**:
The length removed from each end of a Stock before placing Parts, to discard damaged or out-of-square ends.
_Avoid_: Margin, allowance, end cut
_Spanish_: Saneado

**Minimum Offcut Length**:
The user-defined threshold that decides whether a leftover of a Stock is worth keeping: leftovers at least this long are Offcuts, shorter ones are Waste.
_Avoid_: Minimum reusable length, scrap threshold
_Spanish_: Longitud mínima de retal

**Offcut**:
A leftover of a Stock that is at least the Minimum Offcut Length, kept for future work.
_Avoid_: Remnant, scrap, leftover
_Spanish_: Retal

**Waste**:
Material that cannot be reused: leftovers shorter than the Minimum Offcut Length, Trim, and Kerf.
_Avoid_: Scrap, loss
_Spanish_: Desperdicio
