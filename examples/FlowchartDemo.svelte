<script>
  import { Chart, Box, Diamond, Ellipse, Parallelogram, Text, Arrow, CurvedLine, ConnectorLine } from '@thomasfosterau/charts';
</script>

<div class="demo-container">
  <h1>Flowchart & Diagram Building Blocks Demo</h1>
  
  <section class="demo-section">
    <h2>1. Basic Shapes</h2>
    <p>Fundamental shapes used in flowcharts and diagrams</p>
    
    <Chart width={1200} height={250} renderTarget="svg">
      <!-- Box -->
      <Box x1={5} y1={20} x2={20} y2={80} 
           fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} />
      <Text x={12.5} y={50} text="Box" fontSize={14} />
      
      <!-- Rounded Box -->
      <Box x1={25} y1={20} x2={40} y2={80} 
           fill="#f3e5f5" stroke="#7b1fa2" strokeWidth={2} 
           rounded={true} radius={8} />
      <Text x={32.5} y={50} text="Rounded" fontSize={14} />
      
      <!-- Diamond -->
      <Diamond centerX={52.5} centerY={50} width={15} height={30}
               fill="#fff3e0" stroke="#f57c00" strokeWidth={2} />
      <Text x={52.5} y={50} text="Decision" fontSize={12} />
      
      <!-- Ellipse -->
      <Ellipse centerX={72.5} centerY={50} radiusX={7.5} radiusY={15}
               fill="#e8f5e9" stroke="#388e3c" strokeWidth={2} />
      <Text x={72.5} y={50} text="Ellipse" fontSize={14} />
      
      <!-- Parallelogram -->
      <Parallelogram x1={80} y1={30} x2={95} y2={70} skew={3}
                     fill="#fce4ec" stroke="#c2185b" strokeWidth={2} />
      <Text x={87.5} y={50} text="I/O" fontSize={14} />
    </Chart>
  </section>
  
  <section class="demo-section">
    <h2>2. Connectors and Arrows</h2>
    <p>Various types of connectors for linking diagram elements</p>
    
    <Chart width={1200} height={200} renderTarget="svg">
      <!-- Straight arrow -->
      <Arrow startX={10} startY={50} endX={30} endY={50}
             stroke="#1976d2" strokeWidth={2} />
      <Text x={20} y={35} text="Straight Arrow" fontSize={12} />
      
      <!-- Curved line -->
      <CurvedLine startX={40} startY={50} endX={60} endY={50}
                  stroke="#388e3c" strokeWidth={2} />
      <Text x={50} y={35} text="Curved Line" fontSize={12} />
      
      <!-- Multi-segment line -->
      <ConnectorLine points={[
        { x: 70, y: 50 },
        { x: 75, y: 50 },
        { x: 75, y: 70 },
        { x: 85, y: 70 },
        { x: 85, y: 50 },
        { x: 90, y: 50 }
      ]} stroke="#f57c00" strokeWidth={2} />
      <Text x={80} y={35} text="Multi-segment" fontSize={12} />
    </Chart>
  </section>
  
  <section class="demo-section">
    <h2>3. Simple Flowchart Example</h2>
    <p>A complete flowchart demonstrating a decision-making process</p>
    
    <Chart width={1200} height={400} renderTarget="svg">
      <!-- Start -->
      <Ellipse centerX={50} centerY={15} radiusX={8} radiusY={6}
               fill="#e8f5e9" stroke="#388e3c" strokeWidth={2} />
      <Text x={50} y={15} text="Start" fontSize={14} />
      
      <!-- Arrow down -->
      <Arrow startX={50} startY={21} endX={50} endY={30} stroke="#333" strokeWidth={2} />
      
      <!-- Process box -->
      <Box x1={40} y1={30} x2={60} y2={45}
           fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} />
      <Text x={50} y={37.5} text="Process Data" fontSize={13} />
      
      <!-- Arrow down -->
      <Arrow startX={50} startY={45} endX={50} endY={52} stroke="#333" strokeWidth={2} />
      
      <!-- Decision diamond -->
      <Diamond centerX={50} centerY={62} width={20} height={20}
               fill="#fff3e0" stroke="#f57c00" strokeWidth={2} />
      <Text x={50} y={60} text="Valid?" fontSize={13} />
      
      <!-- Yes arrow (right) -->
      <Arrow startX={60} startY={62} endX={70} endY={62}
             stroke="#388e3c" strokeWidth={2} />
      <Text x={65} y={58} text="Yes" fontSize={11} fill="#388e3c" />
      
      <!-- Success box -->
      <Box x1={70} y1={55} x2={90} y2={69}
           fill="#e8f5e9" stroke="#388e3c" strokeWidth={2} rounded={true} radius={5} />
      <Text x={80} y={62} text="Success" fontSize={13} />
      
      <!-- No arrow (down) -->
      <Arrow startX={50} startY={72} endX={50} endY={78}
             stroke="#d32f2f" strokeWidth={2} />
      <Text x={45} y={75} text="No" fontSize={11} fill="#d32f2f" />
      
      <!-- Error box -->
      <Box x1={40} y1={78} x2={60} y2={92}
           fill="#ffebee" stroke="#d32f2f" strokeWidth={2} rounded={true} radius={5} />
      <Text x={50} y={85} text="Handle Error" fontSize={13} />
    </Chart>
  </section>
  
  <section class="demo-section">
    <h2>4. Entity Relationship Diagram Example</h2>
    <p>A simple ERD showing entity relationships</p>
    
    <Chart width={1200} height={300} renderTarget="svg">
      <!-- User entity -->
      <Box x1={10} y1={40} x2={30} y2={60}
           fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} />
      <Text x={20} y={48} text="User" fontSize={14} fontWeight="bold" />
      <Text x={20} y={54} text="id, name, email" fontSize={10} />
      
      <!-- Relationship arrow -->
      <Arrow startX={30} startY={50} endX={40} endY={50} stroke="#666" strokeWidth={2} />
      <Text x={35} y={45} text="1:N" fontSize={10} />
      
      <!-- Post entity -->
      <Box x1={40} y1={40} x2={60} y2={60}
           fill="#f3e5f5" stroke="#7b1fa2" strokeWidth={2} />
      <Text x={50} y={48} text="Post" fontSize={14} fontWeight="bold" />
      <Text x={50} y={54} text="id, title, content" fontSize={10} />
      
      <!-- Relationship arrow -->
      <Arrow startX={60} startY={50} endX={70} endY={50} stroke="#666" strokeWidth={2} />
      <Text x={65} y={45} text="N:N" fontSize={10} />
      
      <!-- Tag entity -->
      <Box x1={70} y1={40} x2={90} y2={60}
           fill="#fff3e0" stroke="#f57c00" strokeWidth={2} />
      <Text x={80} y={48} text="Tag" fontSize={14} fontWeight="bold" />
      <Text x={80} y={54} text="id, name" fontSize={10} />
    </Chart>
  </section>
</div>

<style>
  .demo-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f5f5;
  }
  
  h1, h2 {
    color: #333;
  }
  
  .demo-section {
    background: white;
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  p {
    color: #666;
    margin-bottom: 15px;
    line-height: 1.6;
  }
  
  :global(svg) {
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
  }
</style>
