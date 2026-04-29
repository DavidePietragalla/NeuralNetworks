# NeuralNetwors Project Context

## Project Overview

**NeuralNetwors** is a visual Domain-Specific Language (DSL) for designing neural network architectures through an intuitive drag-and-drop interface. It combines a Svelte-based visual editor with a Python backend to create a complete workflow for neural network prototyping:

1. **Design** - Create neural network diagrams with a visual editor (using `@xyflow/svelte`)
2. **Configure** - Set hyperparameters through an interactive modal interface
3. **Export** - Generate configuration files in JSON format
4. **Convert** - Transform JSON diagrams into Hydra configs for PyTorch Lightning training
5. **Train** - Use generated configs with PyTorch Lightning in the `converted/` folder

### Key Technologies

- **Frontend**: Svelte 5, TypeScript, Vite, `@xyflow/svelte` for node-based diagrams
- **Backend**: Python 3.14+, PyTorch Lightning, Hydra/OmegaConf for configuration management
- **Training Pipeline**: MNIST-FDS reference implementation in `converted/` folder

### Architecture

```
NeuralNetwors/
├── nn_frontend/              # SvelteKit visual editor (drag-and-drop UI)
│   └── src/
│       ├── lib/
│       │   ├── Modules/     # 20+ pre-built neural network components (JSON)
│       │   ├── Joins/       # Join/split operation definitions
│       │   ├── model/       # Core domain models (Node, Module, Stereotype)
│       │   ├── view/        # View layer components
│       │   └── components/  # Svelte UI components
│       └── routes/          # SvelteKit routes (+page.svelte is main editor)
├── converted/               # Production training pipeline (MNIST-FDS reference)
│   ├── cfg/                 # Hydra config directory (base config for MNIST)
│   ├── cfg2/                # Generated configs from DSL conversion
│   └── src/                 # Training code (main.py, net/, dataset/)
└── .agents/skills/          # Qwen Code skill implementations
```

## Supported Neural Network Modules

### Neural Network Layers
- `Conv2d`, `Linear`, `MaxPool2d`, `AvgPool2d`, `Flatten`, `Embedding`

### Activation Functions
- `ReLU`, `Sigmoid`, `Tanh`, `Softmax`

### Normalization
- `BatchNorm1d`, `BatchNorm2d`, `LayerNorm`

### Attention & Transformers
- `MultiheadAttention`, `TransformerEncoderLayer`, `TransformerDecoderLayer`

### Loss Functions
- `BCELoss`, `BCEWithLogitsLoss`, `CrossEntropyLoss`, `MSELoss`

### Special
- `Input`, `Dropout`

## Building and Running

### Prerequisites
- Python >= 3.14
- Node.js >= 20.x
- `uv` package manager (Python)

### Installation

```bash
# Sync Python dependencies
uv sync

# Install frontend dependencies
cd nn_frontend
npm install
```

### Development Commands

```bash
# Start the visual editor (Svelte dev server)
cd nn_frontend
npm run dev
# or with auto-open: npm run dev -- --open

# Build frontend for production
npm run build
npm run preview

# Check TypeScript and Svelte
npm run check
npm run check:watch
```

### Python Backend

The Python conversion script generates Hydra configs from exported JSON diagrams:

```bash
# Convert a JSON diagram to Hydra configs
cd converted
python src/convert.py path/to/model_export.json [output_dir]
# Default: converts ../converted_minst.json to cfg/

# Run training with generated configs
python src/main.py

# Training with Hydra config overrides
python src/main.py net.depth=3 net.width=64
python src/main.py --config-path=cfg --config-name=base
```

## Development Conventions

### Frontend Architecture

**Model-View separation**:
- `model/` contains domain classes (Module, Node, Stereotype, Join, SubGraph)
- `view/` contains view-specific classes (VNode, VConnection)
- `components/` contains Svelte UI components
- `Modules/*.json` define module templates (20+ predefined)

**Diagram Class** (`diagram.svelte.ts`):
- Central state management for the diagram
- Manages nodes, edges, stereotypes, and joins
- Handles node/module creation, updates, and deletion
- Maintains connection validation and graph structure

**Node Types**:
- `Module` - Neural network layer with parameters
- `Join` - Branching point for multi-branch networks
- `SubGraph` - Grouping of nodes into nested diagrams

### Module Definition Format

Modules are defined as JSON in `nn_frontend/src/lib/Modules/`:

```json
{
  "category": "Conv2d",
  "pythonClassName": "nn.Conv2d",
  "expr": "",
  "view": {
    "color": "#20b2aa",
    "width": 140,
    "height": 60
  },
  "params": {
    "in_channels": {
      "type": "int",
      "default": "Undefined"
    },
    "out_channels": {
      "type": "int",
      "default": "Undefined"
    }
  }
}
```

### Adding Custom Modules

1. Create a JSON file in `nn_frontend/src/lib/Modules/`
2. Define the module structure (see above format)
3. Restart the dev server to load the new module
4. The module will appear in the "Aggiungi Module" modal

### Python Configuration System

The `converted/` folder uses **Hydra** for configuration management:

**Config Structure**:
- `cfg/layer/*.yaml` - Individual layer configurations with `_target_`
- `cfg/net/custom_sequence.yaml` - Main network configuration (sequence of layers)
- `cfg/optimizer/*.yaml` - Optimizer configurations
- `cfg/trainer/*.yaml` - Trainer settings
- `cfg/wandb/wandb.yaml` - Weights & Biases settings
- `cfg/dataset/dataset.yaml` - Dataset configuration
- `cfg/base.yaml` - Main config combining all defaults

**Key Patterns**:
- Layer configs use `${..width}`, `${.in_channels}` for parameter inheritance
- Network is built from `embed` → `features` → `unembed` pipeline
- Supports hyperparameter sweeps via command-line overrides

**Training Entry Point** (`src/main.py`):
- Uses Hydra for config management
- `SequentialNet` for generated configs
- PyTorch Lightning for training loop
- Weights & Biases for experiment tracking
- Early stopping on `val_acc`

## Testing and Verification

```bash
# Frontend type checking
cd nn_frontend
npm run check

# Run training (tests the full pipeline)
cd converted
python src/main.py

# Verify config generation
python src/convert.py path/to/model.json
# Check generated cfg/ folder structure
```

## Common Workflows

### Creating a Neural Network Diagram

1. Launch the visual editor: `cd nn_frontend && npm run dev`
2. Click **"➕ Aggiungi Module"** to add a layer
3. Select a module type from the modal
4. Configure parameters (e.g., `in_channels`, `out_channels`)
5. Click **"🔗 Inserisci Join"** to create branching points if needed
6. Connect modules by dragging from output to input handles
7. Click **"💾 Esporta JSON"** to save the diagram configuration

### Exporting and Training

1. Export the diagram as JSON (default: `converted_minst.json`)
2. Run the converter: `cd converted && python src/convert.py`
3. Train with generated configs: `python src/main.py`
4. View results in Weights & Biases dashboard

### Hyperparameter Sweeps

```bash
# Run with custom parameters
python src/main.py net.depth=3 net.width=64 optimizer.lr=0.001

# Use sweep script
./sweep.sh
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `nn_frontend/src/routes/+page.svelte` | Main visual editor UI |
| `nn_frontend/src/lib/diagram.svelte.ts` | Core diagram state management |
| `nn_frontend/src/lib/model/module.ts` | Module class definition |
| `nn_frontend/src/lib/model/node.ts` | Node model abstraction |
| `nn_frontend/src/lib/components/SLayer.svelte` | Visual representation of modules |
| `nn_frontend/src/lib/Modules/*.json` | 20+ pre-built module definitions |
| `converted/src/convert.py` | JSON-to-Hydra config converter |
| `converted/src/main.py` | Training entry point with Hydra |
| `converted/src/net/sequential.py` | Sequential network implementation |
| `converted/src/dataset/mnist.py` | MNIST dataset implementation |

## Troubleshooting

**Common Issues**:

1. **Module not appearing in modal**: Restart the dev server after adding new module JSON files
2. **Connection validation errors**: Ensure output channels match input channels between connected layers
3. **Multiple loss functions**: Only one loss function module should be in the diagram
4. **Config conversion fails**: Verify JSON structure matches expected format
5. **Training fails with missing config**: Ensure all required defaults are in `base.yaml`

**Debugging**:
- Open browser console for diagram errors
- Check `model_export.json` for export issues
- Set `HYDRA_FULL_ERROR=1` for detailed Python errors
- Check Weights & Biases logs for training issues

## Related Resources

- **[MNIST-FDS](https://github.com/your-username/MNIST-FDS)** - Reference implementation used in `converted/` folder
- **[@xyflow/svelte](https://github.com/wbkd/svelte-flow)** - Visual editor foundation
- **[Hydra](https://github.com/facebookresearch/hydra)** - Configuration management
- **[PyTorch Lightning](https://github.com/Lightning-AI/lightning)** - Training framework
