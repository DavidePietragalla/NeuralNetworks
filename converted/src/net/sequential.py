from omegaconf import DictConfig
import torch
import lightning as lit
from torchmetrics import Accuracy

import torch.nn as nn
import torch.nn.functional as F

from hydra.utils import instantiate
from typing import List, Dict, Any


class SequentialNet(lit.LightningModule):
    """A neural network that can be dynamically built from a sequence of layers.
    
    This class reads layer configurations from the Hydra config and builds
    the network dynamically. It supports both simple sequential networks
    and networks with residual connections (via Fork/Join).
    """
    
    def __init__(self, cfg: DictConfig):
        super().__init__()
        self.save_hyperparameters()

        self.cfg = cfg
        # Initialize accuracy metric
        self.accuracy = Accuracy(task="multiclass", num_classes=10)
        # Use Hydra's resolve to get the merged config values
        self.sequence: List[str] = cfg.net.sequence
        self.name = cfg.net.name
        
        # Build the network from the sequence
        self.layers: nn.ModuleDict = nn.ModuleDict()
        self.layer_order: List[str] = []
        
        # Register torch.nn as a search path for instantiate
        from hydra.utils import get_class
        import torch.nn as nn_module
        
        # First, instantiate all layers (sequence already excludes input markers)
        # Layers are accessed via cfg.net[layer_id] since custom_sequence is nested
        for layer_id in self.sequence:
            layer_cfg = cfg.net[layer_id]
            # Replace nn. prefix with torch.nn. if needed
            target = layer_cfg.get("_target_", "")
            if target and target.startswith("nn."):
                layer_cfg["_target_"] = "torch." + target
            layer = instantiate(layer_cfg)
            self.layers[layer_id] = layer
            self.layer_order.append(layer_id)
        
        # Build the forward pass graph
        # For now, we assume a simple sequential flow
        # Fork/Join nodes will be handled differently
        self._build_forward_graph()
    
    def _build_forward_graph(self):
        """Build the forward pass graph from the sequence.
        
        For simple sequential networks, this just chains layers together.
        For networks with branches, we need to track which layers feed into which.
        """
        self.is_sequential = True
        
        # Check if we have fork/join nodes
        for layer_id in self.sequence:
            layer_cfg = self.cfg.net[layer_id]
            target = layer_cfg._target_
            
            if 'Fork' in target or 'Join' in target:
                self.is_sequential = False
                break
        
        # For sequential networks, we can use nn.Sequential
        if self.is_sequential:
            self.model = nn.Sequential()
            for layer_id in self.sequence:
                self.model.add_module(layer_id, self.layers[layer_id])
        else:
            # For non-sequential networks, we need to implement custom forward
            self.model = None
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass through the network."""
        # Flatten input if needed (MNIST images are (1, 28, 28), need (784,))
        if x.dim() > 2:
            x = x.view(x.size(0), -1)
        
        if self.is_sequential and self.model is not None:
            return self.model(x)
        else:
            # Custom forward for non-sequential networks
            return self._forward_custom(x)
    
    def _forward_custom(self, x: torch.Tensor) -> torch.Tensor:
        """Custom forward pass for non-sequential networks."""
        # For now, just pass through all layers sequentially
        # This can be extended to handle branches
        for layer_id in self.sequence:
            layer = self.layers[layer_id]
            x = layer(x)
        return x
    
    def training_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        
        # Get the loss from config (can be at cfg.loss or cfg.net.loss)
        loss_cfg = self.cfg.get("loss", self.cfg.net.get("loss"))
        loss_fn = instantiate(loss_cfg)
        loss = loss_fn(y_hat, y)
        
        self.log("train_loss", loss, prog_bar=True)
        return loss
    
    def validation_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        
        # Get the loss from config (can be at cfg.loss or cfg.net.loss)
        loss_cfg = self.cfg.get("loss", self.cfg.net.get("loss"))
        loss_fn = instantiate(loss_cfg)
        loss = loss_fn(y_hat, y)
        
        self.log("val_loss", loss)
        self.log("val_acc", self.accuracy(y_hat, y), prog_bar=True)
    
    def test_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        
        loss_cfg = self.cfg.get("loss", self.cfg.net.get("loss"))
        loss_fn = instantiate(loss_cfg)
        loss = loss_fn(y_hat, y)
        
        self.log("test_loss", loss)
        self.log("test_acc", self.accuracy(y_hat, y), prog_bar=True)
    
    def configure_optimizers(self):
        optimizer = instantiate(self.cfg.optimizer, self.parameters())
        return optimizer
    
    def on_train_epoch_end(self):
        # Log learning rate
        if hasattr(self, 'lr_scheduler'):
            self.log("lr", self.optimizer.param_groups[0]["lr"], prog_bar=True)
