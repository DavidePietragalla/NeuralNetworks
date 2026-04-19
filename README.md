# NeuralNetwors - Diagrammatic Neural Network DSL

A visual Domain-Specific Language (DSL) for designing neural network architectures through an intuitive drag-and-drop interface. NeuralNetwors allows you to build, configure, and export neural network models without writing code manually.

## 🚀 Overview

NeuralNetwors combines a visual editor with a Python backend to create a complete workflow for neural network prototyping:

1. **Design** - Create neural network diagrams with a Svelte-based visual editor
2. **Configure** - Set hyperparameters through an interactive modal interface
3. **Export** - Generate configuration files in JSON or Hydra format
4. **Train** - Use generated configs with PyTorch Lightning

![Architecture Diagram](https://placehold.co/800x400/20232a/1a1b26?text=Visual+Editor+%E2%86%92+JSON+Export+%E2%86%92+Python+Conversion+%E2%86%92+PyTorch+Lightning)

## ✨ Features

- 🎨 **Visual Node Editor** - Drag-and-drop interface using `@xyflow/svelte`
- 🧱 **Extensible Module Library** - 20+ pre-built neural network components
- ⚙️ **Parameter Configuration** - Type-safe parameter setting for each layer
- 🔄 **Automatic Connection Validation** - Ensures proper input/output channel matching
- 📁 **Import/Export** - Save and load diagram configurations as JSON
- 🐍 **Python Integration** - Convert diagrams to Hydra configs for training

## 📦 Supported Modules

### Neural Network Layers
- `Conv2d` - 2D convolutional layer
- `Linear` - Fully connected layer
- `MaxPool2d` - 2D max pooling
- `AvgPool2d` - 2D average pooling
- `Flatten` - Flatten input tensor
- `Embedding` - Embedding layer

### Activation Functions
- `ReLU` - Rectified Linear Unit
- `Sigmoid` - Sigmoid activation
- `Tanh` - Hyperbolic tangent
- `Softmax` - Softmax function

### Normalization
- `BatchNorm1d` - Batch normalization (1D)
- `BatchNorm2d` - Batch normalization (2D)
- `LayerNorm` - Layer normalization

### Attention & Transformers
- `MultiheadAttention` - Multi-head attention mechanism
- `TransformerEncoderLayer` - Transformer encoder layer
- `TransformerDecoderLayer` - Transformer decoder layer

### Loss Functions
- `BCELoss` - Binary Cross Entropy Loss
- `BCEWithLogitsLoss` - BCE with logits
- `CrossEntropyLoss` - Cross entropy loss
- `MSELoss` - Mean Squared Error Loss

### Special
- `Input` - Input node for the network
- `Dropout` - Dropout regularization

## 🏗️ Project Structure

```
NeuralNetwors/
├── nn_frontend/              # SvelteKit visual editor
│   ├── src/
│   │   ├── lib/
│   │   │   ├── Modules/     # Module stereotypes (JSON definitions)
│   │   │   ├── model/       # Core models (Node, Module, Stereotype)
│   │   │   ├── view/        # View layer components
│   │   │   └── components/  # Svelte UI components
│   │   └── routes/          # SvelteKit routes
│   └── static/              # Static assets
├── src/                     # Python backend
│   ├── main.py              # Core Python classes
│   └── convert_to_yaml.py   # JSON to Hydra config converter
├── analysis/                # Analysis artifacts (vpp files)
├── pyproject.toml           # Python dependencies
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Python >= 3.14
- Node.js >= 20.x
- `uv` package manager (Python)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd NeuralNetwors
```

2. **Set up Python environment**
```bash
uv sync
```

3. **Install frontend dependencies**
```bash
cd nn_frontend
npm install
```

### Development

1. **Start the visual editor**
```bash
cd nn_frontend
npm run dev
# or
npm run dev -- --open
```

2. **Convert diagram to config**
```bash
cd ../src
python convert_to_yaml.py
```

### Building for Production

```bash
cd nn_frontend
npm run build
npm run preview
```

## 🎯 Usage Workflow

### 1. Creating a Neural Network

1. Launch the visual editor: `npm run dev`
2. Click **"➕ Aggiungi Module"** to add a layer
3. Select a module type from the modal
4. Configure parameters (e.g., `in_channels`, `out_channels`)
5. Click **"🔗 Inserisci Join"** to create branching points if needed
6. Connect modules by dragging from output to input handles

### 2. Configuring Modules

1. Double-click any module on the canvas
2. Modify parameters in the configuration modal
3. Click **"Chiudi"** to save changes

### 3. Exporting Configuration

1. Click **"💾 Esporta JSON"** to save the diagram configuration
2. Click **"💾 Converti"** to generate Hydra config files in `cfg/` directory
3. The exported JSON follows this structure:

```json
{
  "network": [
    {
      "id": "layer_0",
      "name": "Conv2d_0",
      "target": "nn.Conv2d",
      "params": {
        "in_channels": {"value": "3", "type": "int"},
        "out_channels": {"value": "64", "type": "int"}
      }
    }
  ],
  "loss": {
    "id": "loss_0",
    "name": "CrossEntropyLoss",
    "target": "nn.CrossEntropyLoss",
    "params": {}
  }
}
```

## 🔧 Configuration Files

The converter generates Hydra configuration files:

- `cfg/layer/*.yaml` - Individual layer configurations
- `cfg/net/custom_sequence.yaml` - Main network configuration

Example layer config (`cfg/layer/layer_0.yaml`):
```yaml
_target_: nn.Conv2d
in_channels: 3
out_channels: 64
kernel_size: 3
stride: 1
padding: 1
bias: true
```

## 🐍 Python Backend

The Python backend provides:

- **NeuralNetwork** class for managing layer sequences
- **Layer** abstract base class for all layers
- **IntegerGZ** type for positive integer validation
- **Hydra config generation** for Lightning integration

```python
# Example usage
from src.main import NeuralNetwork, Linear, ReLU

nn = NeuralNetwork()
nn.add_layer(Linear(in_channels=784, out_channels=128))
nn.add_layer(ReLU())
```

## 📚 Extending with Custom Modules

To add a new module type:

1. Create a JSON file in `nn_frontend/src/lib/Modules/`
2. Define the module structure:

```json
{
  "category": "CustomLayer",
  "pythonClassName": "nn.CustomLayer",
  "expr": "",
  "view": {
    "color": "#your-color",
    "width": 120,
    "height": 60
  },
  "params": {
    "param_name": {
      "type": "int",
      "default": "default_value"
    }
  }
}
```

3. Restart the development server to load the new module

## 🧪 Complete Training Pipeline (`converted/`)

The `converted/` folder contains a fully functional neural network training pipeline demonstrating the end-to-end workflow from diagram to trained model. This is a production-ready implementation that uses the generated configs for training with PyTorch Lightning.

### Structure

```
converted/
├── cfg/              # Hydra config directory (original MNIST-FDS config)
│   ├── base.yaml     # Base configuration
│   ├── net/          # Network architecture configs
│   ├── embed/        # Embedding layer config
│   ├── block/        # Feature extraction blocks
│   ├── unembed/      # Output layer config
│   └── optimizer/    # Optimizer config
├── cfg2/             # Generated configs from diagram conversion
│   ├── layer/*.yaml  # Individual layer configs
│   └── net/custom_sequence.yaml
├── src/              # Python training code
│   ├── main.py       # Training entry point with Hydra
│   ├── convert.py    # JSON-to-Hydra converter
│   ├── net/          # Model architectures (base, cnn, fork)
│   └── dataset/      # Dataset implementations (ds, mnist)
├── prompt.txt        # Complete project file listing
├── sweep.sh          # Hyperparameter sweep script
└── pyproject.toml    # Dependencies
```

### Key Components

**1. Training Pipeline ([`src/main.py`](/home/softdream/Programming/gits/NeuralNetwors/converted/src/main.py))**
- Uses **Hydra** for configuration management
- **PyTorch Lightning** for training loop
- **Weights & Biases** for experiment tracking
- Supports hyperparameter sweeps via command-line overrides

**2. Model Architecture ([`src/net/base.py`](/home/softdream/Programming/gits/NeuralNetwors/converted/src/net/base.py))**
- Composes network from Hydra-instantiated components
- Uses `embed` → `features` (sequential blocks) → `unembed` pipeline
- Standard training/validation/test steps with accuracy tracking

**3. Configuration System**
- Modular Hydra configs allow mixing-and-matching components
- Supports parameter inheritance (`${..width}`, `${.in_channels}`)
- Configurable depth, width, learning rate, etc.

**4. Dataset Abstraction ([`src/dataset/`](/home/softdream/Programming/gits/NeuralNetwors/converted/src/dataset/))**
- Abstract `Dataset` base class with `division()` method
- `MNISTDataset` implements train/val/test split with normalization

### `cfg2/` - Generated Configs from Diagram

The `cfg2/` folder contains configs generated from your visual diagram:
- **8 layers** including input, convolutions, activations, and loss
- Generated via [`convert.py`](/home/softdream/Programming/gits/NeuralNetwors/converted/src/convert.py)
- Shows the output format from your DSL conversion script

### Missing Component

The [`src/net/fork.py`](/home/softdream/Programming/gits/NeuralNetwors/converted/src/net/fork.py) file contains incomplete `Fork` and `Join` module implementations, suggesting plans for supporting branching network architectures (residual connections, multi-branch nets).

### Usage

```bash
# Run with default config
python src/main.py

# Run with custom hyperparameters
python src/main.py net.depth=3 net.width=64

# Convert diagram to config
python src/main.py convert path/to/model_export.json

# Run hyperparameter sweep
./sweep.sh
```

## 🛠️ Technical Details

### Frontend Technologies
- **Svelte 5** - Reactive UI framework
- **TypeScript** - Type-safe development
- **@xyflow/svelte** - Node-based diagram editor
- **Vite** - Fast build tool

### Backend Technologies
- **Python 3.14+** - Core logic
- **PyTorch Lightning** - Training framework
- **Hydra/OmegaConf** - Configuration management

### Data Flow
```
User Interaction → Diagram Model → JSON Export → Python Converter → Hydra Config → Lightning Training
```

## 🐛 Troubleshooting

### Common Issues

1. **Module not appearing**: Restart the dev server after adding new module JSON files
2. **Connection validation errors**: Ensure output channels match input channels between connected layers
3. **Multiple loss functions**: Only one loss function module should be in the diagram

### Debugging
- Open browser console for diagram errors
- Check `model_export.json` for export issues
- Verify Python path in `convert_to_yaml.py`

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Acknowledgments

- Visual editor built with [@xyflow/svelte](https://github.com/wbkd/svelte-flow)
- Hydra configuration inspired by [Hydra](https://github.com/facebookresearch/hydra)
- PyTorch Lightning integration

## 📞 Support

For issues and feature requests, please [open an issue](https://github.com/your-username/NeuralNetwors/issues).

## 🔗 Related Repositories

- **[MNIST-FDS](https://github.com/your-username/MNIST-FDS)** - Reference implementation used in `converted/` folder
- Original codebase providing the training pipeline template

---
