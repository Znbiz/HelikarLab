# Variant 1 (the first that came to mind)

Results algorithm
- Name: Bronchiseptica  Time: 41.00 Score: 36.59  
- Name: CD4 Time: 113.00  Score: 50.33  
- Name: EGFR  Time: 84.00 Score: 51.33  
- Name: ErbB  Time: 188.00  Score: 416.38 
- Name: FA-BRCA Time: 27.00 Score: 47.80  
- Name: Glucose Time: 20.00 Score: 23.27  
- Name: HGF Time: 13.00 Score: 18.92  
- Name: IL-1  Time: 28.00 Score: 36.41  
- Name: IL-6  Time: 21.00 Score: 27.56  
- Name: Influenza Time: 86.00 Score: 68.99  
- Name: T-Cell-Receptor Time: 22.00 Score: 25.22  
- Name: T-Cell  Time: 67.00 Score: 77.93  
- Name: T-LGL-2011  Time: 16.00 Score: 28.93  
- Name: T-LGL Time: 29.00 Score: 47.87  
- Name: Yeast-Apoptosis Time: 14.00 Score: 22.40  
- Name: circle-10 Time: 1.00  Score: 3.61 
- Name: circle-100  Time: 24.00 Score: 7.52 
- Name: circle-1000 Time: 426.00  Score: 23.60  
- Name: drosophila  Time: 7.00  Score: 6.37 
- Name: fibroblast  Time: 212.00  Score: 174.53 
- Name: graph-10-1  Time: 3.00  Score: 3.47 
- Name: graph-10-2  Time: 1.00  Score: 7.51 
- Name: graph-10-3  Time: 2.00  Score: 8.08 
- Name: graph-100-1 Time: 23.00 Score: 12.78  
- Name: graph-100-2 Time: 21.00 Score: 27.58  
- Name: graph-100-3 Time: 21.00 Score: 36.99  
- Name: graph-1000-1  Time: 456.00  Score: 114.59 
- Name: graph-1000-2  Time: 683.00  Score: 275.72 
- Name: graph-1000-3  Time: 914.00  Score: 446.18 
- Name: line-10 Time: 8.00  Score: 3.14 
- Name: line-100  Time: 13.00 Score: 7.07 
- Name: line-1000 Time: 410.00  Score: 23.30  
- Name: macrophage  Time: 184.00  Score: 88.68  
- Name: star-10 Time: 1.00  Score: 3.89 
- Name: star-100  Time: 53.00 Score: 26.85  
- Name: star-1000 Time: 507.00  Score: 263.51 



Here is an algorithm.

The input parameters are (nodes, edges, size).

1) Create a structure:
graph { 
             NAME: {     // node label
                    coordinate: [x,y],
                    coordinat_bool: true, // true- if given the coordinates, false- unless specified coordinates
                     list_nodes: [    // adjacency list
                          {    
                              label: NAME,
                              weight: INT, // node degree
                              sim: REAL // weight edge
                           } ],
                      weight: INT, // node degree
                      sim_run: REAL //  weight edge, on which is painted a vertex
              }
}

2) Create an array: 
graph_mas [              
              {
                 label: NAME,    // node label
                 list_nodes: [      // adjacency list
                          {
                                  label: NAME,
                                  weight: INT, // node degree
                           } ],
                  weight: INT  // node degree
         } ]

3) Sort the array descending weight  (graph_mas)

4) Since the best algorithm is slow if the number of edges > 900. Using two algorithms:

The first case: number of edges <= 900
4.1) Function SimEdge2() calculates the weight of each edge. We calculate the average weight of all edges. We delete edges, which weight is less than average/2.

The formula to calculate the weight: 
Sim(i, j) = | Adj(i) intersection Adj(j) | / | Adj(i) union Adj(j) |
Where Adj(i) - vertices adjacent to i.

4.2) We calculate the coordinates of the vertices.

Loop through graph_mas and for each node call the CoordinatesWeight(node) to calculate coordinates of current node and coordinates for all nodes that are adjacent to current node.
Function CoordinatesWeight(node) checks if the node already has the coordinates. If node has the coordinates we do not change them. Then, this function calculates the coordinates of the adjacent nodes if they are not set.

The function CoordinatesWeight(node) calls Coordinat(x_shift, y_shift, node_label) function. The arguments are the coordinates of the node and adjacent node name. Coordinat(x_shift, y_shift, node_label) function iterates through free points on the grid. We are looking for a free point in a square 3 * 3. If there is no free points then we go to the square 5 * 5 and are looking for further already there, and so on. The center of all squares is the point with coordinates (x_shift, y_shift). For each position we calculate total weight of edges adjacent to the node. This loop has n iterations (n - is a parameter). We use the coordinates which minimizes total weight of edges adjacent to the node.

The second case: number of edges > 900.
This algorithm is worse than the previous one, but much faster

Calculate the coordinates of the nodes using CoordinatStar(x_shift, y_shift):

We look for a point that lies in the square with side 2*diametr (1 <= diametr < size). Square center (x_shift , y_shift ). Point should be free. The node’s coordinates are searched for bypassing a square spiral, clockwise.


