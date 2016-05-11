# Variant 1 (the first that came to mind)

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


