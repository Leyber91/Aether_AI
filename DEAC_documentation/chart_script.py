import plotly.graph_objects as go
import plotly.express as px
import numpy as np

# Create a layered architecture diagram with clear data flow
fig = go.Figure()

# Define layer positions and dimensions with full component names
layers = [
    {"name": "Frontend Layer", "y": 0.85, "color": "#1FB8CD", "components": ["AetherCanvas", "AetherCreator", "MetaLoopChat", "DEAC Dashboard"]},
    {"name": "API Gateway", "y": 0.72, "color": "#FFC185", "components": ["FastAPI", "WebSocket", "Authentication", "Rate Limiting"]},
    {"name": "Core Services", "y": 0.55, "color": "#ECEBD5", "components": ["DEAC Controller", "Evolution Eng", "Vector Service", "Memory Manager", "Coordination"]},
    {"name": "Existing Svc", "y": 0.38, "color": "#5D878F", "components": ["MetaLoop Base", "Model Ecosystem", "GGUF Service", "QLora Service"]},
    {"name": "Data Layer", "y": 0.25, "color": "#D2BA4C", "components": ["PostgreSQL", "ChromaDB", "Redis Cache", "File Storage"]},
    {"name": "AI Layer", "y": 0.12, "color": "#B4413C", "components": ["Ollama Host", "AI Models", "GPU Accel*"]},
    {"name": "Infrastructure", "y": 0.02, "color": "#964325", "components": ["Docker", "Nginx Proxy", "Monitoring"]}
]

# Layer dimensions
layer_height = 0.08
layer_width = 0.85
layer_x_start = 0.075

# Draw layers as rectangles with components
for i, layer in enumerate(layers):
    # Main layer rectangle
    fig.add_shape(
        type="rect",
        x0=layer_x_start,
        y0=layer["y"],
        x1=layer_x_start + layer_width,
        y1=layer["y"] + layer_height,
        fillcolor=layer["color"],
        opacity=0.7,
        line=dict(color="white", width=2)
    )
    
    # Layer title
    fig.add_annotation(
        x=layer_x_start + 0.01,
        y=layer["y"] + layer_height - 0.01,
        text=f"<b>{layer['name']}</b>",
        showarrow=False,
        font=dict(size=12, color="black"),
        xanchor="left",
        yanchor="top"
    )
    
    # Components within layer
    comp_width = (layer_width - 0.05) / len(layer["components"])
    for j, comp in enumerate(layer["components"]):
        comp_x = layer_x_start + 0.02 + j * comp_width
        comp_y = layer["y"] + 0.02
        
        # Component box
        fig.add_shape(
            type="rect",
            x0=comp_x,
            y0=comp_y,
            x1=comp_x + comp_width - 0.01,
            y1=comp_y + 0.04,
            fillcolor="white",
            opacity=0.9,
            line=dict(color=layer["color"], width=1)
        )
        
        # Component text (truncate to fit)
        display_text = comp if len(comp) <= 15 else comp[:12] + "..."
        fig.add_annotation(
            x=comp_x + (comp_width - 0.01) / 2,
            y=comp_y + 0.02,
            text=display_text,
            showarrow=False,
            font=dict(size=9, color="black"),
            xanchor="center",
            yanchor="middle"
        )

# Add clear data flow arrows between layers
arrow_connections = [
    (0, 1, "User Requests"),  # Frontend to API
    (1, 2, "API Calls"),     # API to Core Services
    (1, 3, "Service Calls"), # API to Existing Services
    (2, 4, "Data Ops"),      # Core Services to Data
    (2, 5, "AI Requests"),   # Core Services to AI
    (3, 4, "Data Access"),   # Existing Services to Data
    (3, 5, "Model Ops"),     # Existing Services to AI
    (4, 6, "Storage"),       # Data to Infrastructure
    (5, 6, "Compute")        # AI to Infrastructure
]

# Add main vertical data flow arrows
for i, (start_idx, end_idx, flow_type) in enumerate(arrow_connections):
    start_layer = layers[start_idx]
    end_layer = layers[end_idx]
    
    # Calculate arrow positions with slight offsets for multiple arrows
    if start_idx == 1 and end_idx in [2, 3]:  # API to both service layers
        arrow_x = 0.4 if end_idx == 2 else 0.6
    elif start_idx in [2, 3] and end_idx in [4, 5]:  # Services to data/AI
        arrow_x = 0.35 if end_idx == 4 else 0.65
    elif start_idx in [4, 5] and end_idx == 6:  # Data/AI to infrastructure
        arrow_x = 0.4 if start_idx == 4 else 0.6
    else:
        arrow_x = 0.5
    
    start_y = start_layer["y"]
    end_y = end_layer["y"] + layer_height
    
    # Add arrow with annotation
    fig.add_annotation(
        x=arrow_x,
        y=start_y,
        ax=arrow_x,
        ay=end_y,
        arrowhead=3,
        arrowsize=1.5,
        arrowwidth=3,
        arrowcolor="#2E7D32",
        showarrow=True
    )

# Add horizontal coordination arrow between service layers
fig.add_annotation(
    x=layer_x_start + layer_width * 0.3,
    y=layers[2]["y"] + layer_height/2,
    ax=layer_x_start + layer_width * 0.7,
    ay=layers[3]["y"] + layer_height/2,
    arrowhead=3,
    arrowsize=1,
    arrowwidth=2,
    arrowcolor="#FF6F00",
    showarrow=True
)

# Add coordination label
fig.add_annotation(
    x=0.5,
    y=(layers[2]["y"] + layers[3]["y"])/2 + layer_height/2 + 0.01,
    text="Inter-Service Comm",
    showarrow=False,
    font=dict(size=8, color="#FF6F00"),
    xanchor="center",
    yanchor="bottom"
)

# Update layout
fig.update_layout(
    title="Aether AI DEAC System Architecture",
    showlegend=False,
    xaxis=dict(
        showgrid=False,
        showticklabels=False,
        zeroline=False,
        range=[0, 1]
    ),
    yaxis=dict(
        showgrid=False,
        showticklabels=False,
        zeroline=False,
        range=[0, 1]
    ),
    plot_bgcolor='rgba(248,249,250,1)',
    paper_bgcolor='rgba(248,249,250,1)'
)

# Add hardware specification with optimization notes
fig.add_annotation(
    x=0.02,
    y=0.98,
    text="Hardware: Ryzen 9 + RTX 4070* + 32GB RAM",
    showarrow=False,
    font=dict(size=10, color="gray"),
    xanchor="left",
    yanchor="top"
)

# Add GPU optimization note
fig.add_annotation(
    x=0.02,
    y=0.95,
    text="*GPU optimized for AI Layer",
    showarrow=False,
    font=dict(size=8, color="gray"),
    xanchor="left",
    yanchor="top"
)

# Add data flow legend
fig.add_annotation(
    x=0.98,
    y=0.98,
    text="→ Data Flow",
    showarrow=False,
    font=dict(size=10, color="#2E7D32"),
    xanchor="right",
    yanchor="top"
)

fig.add_annotation(
    x=0.98,
    y=0.95,
    text="→ Coordination",
    showarrow=False,
    font=dict(size=10, color="#FF6F00"),
    xanchor="right",
    yanchor="top"
)

# Save the chart
fig.write_image("aether_deac_architecture.png", width=1200, height=900)