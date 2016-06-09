/**
*  The algorithm is taken from an article http://bioinformatics.oxfordjournals.org/content/21/9/2036.full
*/

ccNetViz.layout.grid = function(nodes, edges) {

    /**
     * Each node number is put into correspondence with an array of numbers of neighboring vertex
     * @param {array} number_nodes_label - an array where each vertex name is associated its number
     */
    function Neighbors(number_nodes_label){
        var mas = [];
        var edges_temp = JSON.parse(JSON.stringify(edges));

        /*
        Remove the are multiples of ribs and loops
         */
        var temp = {};
        var temp1 = [];
        for(var i = 0; i < edges_temp.length; i++){
            if(temp[edges_temp[i].target.label] != edges_temp[i].source.label){ 
                temp[edges_temp[i].source.label] = edges_temp[i].target.label;
                temp1.push(edges_temp[i]);
            } 
        }
        edges_temp = temp1;

        for(var i = 0; i < nodes.length; i++){
            var neighbors = [];
            var k = 0;
            for(var j = 0; j < edges_temp.length; j++){
                var t = edges_temp[j].target.label;
                var s = edges_temp[j].source.label
                if (number_nodes_label[t] == i){
                    neighbors[k++] = number_nodes_label[s];
                } else if (number_nodes_label[s] == i){
                    neighbors[k++] = number_nodes_label[t]
                }
            }
            mas[i] = neighbors;
        }
        return mas;
    }

    /**
     * The function finds the optimal path from a point to all 
     * other points of the graph, also gives the optimum distance to all other points.
     * @param {array} visited          - Boolean array attending top of yes or no
     * @param {array} d                - array lengths optimal paths to the heights
     * @param {number} k               - distance from a given initial vertex
     * @param {array} neighbors        - an array of arrays containing the neighbors of each vertex
     * @param {array} queue_neighbors  - all vertex whose neighbors will check if they are not already checked
     * @param {array} path             - the path from the initial vertex to each vertex
     */
    function DijkstrasAlgorithm(visited, d, k, neighbors,queue_neighbors,path){
        var queue_temp = [];
        for(var i = 0; i < queue_neighbors.length; i++){
            if(!visited[queue_neighbors[i]]){  // If this node is not visited that go into it.
                visited[queue_neighbors[i]] = true; 
                for(var j = 0; j < neighbors[queue_neighbors[i]].length; j++){
                    if(d[neighbors[queue_neighbors[i]][j]] > k){
                        for(var temp = 0; temp < path[queue_neighbors[i]].length; temp++){
                            path[neighbors[queue_neighbors[i]][j]].push(path[queue_neighbors[i]][temp]);
                        }
                        path[neighbors[queue_neighbors[i]][j]].push(queue_neighbors[i]);
                        d[neighbors[queue_neighbors[i]][j]] = k;
                    }
                    queue_temp.push(neighbors[queue_neighbors[i]][j]);
                }
            }
        }
        queue_neighbors = JSON.parse(JSON.stringify(queue_temp));
        if(queue_neighbors.length){
            DijkstrasAlgorithm(visited, d, k+1, neighbors,queue_neighbors, path);
        }
    }

    /**
     * Start function to bypass the graph width (Dijkstra's algorithm)
     * @param {array} neighbors - an array of arrays containing the neighbors of each vertex
     * @return {array} It returns an array containing two other array: An array of "special numbers": [nodes_number: SpN, ...]
     * and an array of lengths of optimal routes between all vertices
     */
    function MainDijkstrasAlgorithm(neighbors){
        /*
        An array of "special numbers": [nodes_number: SpN, ...]
         */
        var weight_nodes = []; 

        /*
        An array of lengths of optimal routes between all vertices
         */
        var matrix_length = [];

        /*
        Initialize the output variables
         */
        for(var i = 0; i < nodes.length; i++){
            weight_nodes[i] = 0;
            var temp = [];
            for(var j = 0; j < nodes.length; j++){
                temp[j] = 0;
            }
            matrix_length[i] = temp;
        }

        /*
        Start the crawl count width for each vertex
         */
        for (var i = 0; i < nodes.length; i ++){
            /*
            An array of visited nodes
             */
            var visited = [];
            /*
            An array of lengths of optimal paths from vertex i to all other
             */
            var d = [];
            /*
            An array of the best ways of vertex i to all other
             */
            var path = {};
            /*
            Initialize variables
             */
            for(var j = 0; j < nodes.length; j++){
                visited[j] = false; // initial list of visited nodes is empty
                d[j] = 2000000;
                path[j] = [];
            }
            d[i] = 0;
            var queue_neighbors = [];
            queue_neighbors.push(i);

            DijkstrasAlgorithm(visited, d, 1, neighbors,queue_neighbors, path);

            /*
            We take out of "path" set of weights
             */
            for(var j in path){
                for(var k = 0; k < path[j].length; k++){
                    var node_temp = path[j][k];
                    weight_nodes[node_temp]++;
                }
            }
            /*
            Fill the matrix lengths optimal ways
             */
            for(var j = 0; j < d.length; j++){
                matrix_length[i][j] = d[j];
            }
        }
        /*
        average the results
         */
        for(var i = 0; i < weight_nodes.length; i++){
            weight_nodes[i] /= (nodes.length-1);
        }

        return [weight_nodes, matrix_length];
    }

    /**
     * Specifies the appeal of the grid points for the vertices of the graph
     * @param {number} x             - coordinate
     * @param {number} y             - coordinate
     * @param {number} alpha         - number-node for drawing
     * @param {array} R              - an array vertex drawing with their coordinates
     * @param {array} weight_nodes   - an array with "special numbers"
     * @param {array} matrix_length  - an array of lengths of optimal routes between all vertices
     */
    function AppealPoint(x, y, alpha, R, weight_nodes, matrix_length){
        var appeal = 0;
        for(var i = 0; i < nodes.length; i++){
            if(R[i]){
                var SpN_i = weight_nodes[i];
                var SpN_alpha = weight_nodes[alpha];
                var k = matrix_length[alpha][i];
                var length = Math.sqrt((R[i][0] - x)*(R[i][0] - x) + (R[i][1] - y)*(R[i][1] - y));

                var min = SpN_i > SpN_alpha ? SpN_alpha : SpN_i;
                min = Math.abs(SpN_i - SpN_alpha) > min ? Math.floor(min) : Math.floor(Math.abs(SpN_i - SpN_alpha));
                min = min == 0 ? 1 : min;
                var hit = (length >= k); 
                if(hit){
                    var l = (length / k) > 1 ? 1 : (length / k);
                    var Di = Math.abs(SpN_i - SpN_alpha)  / k / l;
                    var l1 = Math.abs(SpN_i - SpN_alpha) /k <= length ? (min + 1) / SpN_i: Math.abs(SpN_i - SpN_alpha) /k;
                    appeal += (l1 / length / k) + l /SpN_i ;
                } else{
                    var l = (length / k) > 1 ? 1 : (length / k);
                    var l1 = Math.abs(SpN_i - SpN_alpha) /k <= length ? (min - 1) / SpN_i : Math.abs(SpN_i - SpN_alpha) /k;
                    appeal -= (l1 / length / k ) - l / SpN_i  ;
                }
            }
        }
        return appeal;
    }

    /**
     * The function sets the coordinates of all vertices of the graph
     * @param {array} weight_nodes       - an array with "special numbers"
     * @param {array} matrix_length      - an array of lengths of optimal routes between all vertices
     * @param {array} neighbors          - an array of arrays containing the neighbors of each vertex
     * @param {array} number_nodes_label - an array where each vertex name is associated its number
     */
    function Drawing(weight_nodes, matrix_length, neighbors, number_nodes_label){
        var x_min = 0, x_max = 0, y_min = 0, y_max = 0, delta = 0;

        var size = Math.floor(Math.sqrt(nodes.length))
        /*
        The number vertex are not drawn
         -1 As the one the nodes draw
         */
        var not_painted_vertex = nodes.length - 1;

        /*
        not an empty point on the grid
         */
        var busy_point = {};

        var R = [];
        for(var i = 0; i < nodes.length; i++){
            R[i] = false;
        }

        /*
        Arranges neighbors ascending "special number"
         */
        for(var i = 0; i < neighbors.length; i++){
            neighbors[i].sort(function(a,b){ return weight_nodes[a] - weight_nodes[b]; });
        }
        
        /*
        We create an array of vertices and sort them in descending order of "special numbers"
         */
        var vertex = [];
        for(var i = 0; i < nodes.length; i++){
            vertex[i] = i;
        }
        vertex.sort(function(a,b){ return weight_nodes[b] - weight_nodes[a]; });
        
        
        /*
        the first vertex coordinates manually set
         */
        R[vertex[0]] = [0,0];
        busy_point[0+" "+0] = true;
 
        while(not_painted_vertex){
            var max_temp = -Infinity;
            var p_coord = [0,0];
            var alpha = 0;

            /*
            Select the nodes, for which we seek the coordinates
             */
            for(var i = 0; i < vertex.length; i++){
                var flag = false;
                alpha = vertex[i];
                if(!R[alpha]){
                    break;
                }
                for(var j = 0; j < neighbors[vertex[i]].length; j++){
                    alpha = neighbors[vertex[i]][j];
                    if(!R[alpha]){
                        var flag = true;
                        break;
                    }
                }
                if(flag){
                    break;
                }
            } 
            
            /*
            Determine the delta
             */
            var temp_array = [];
            for(var i = 0; i < weight_nodes.length; i++){
                if(R[i]){
                    temp_array.push(weight_nodes[i]);
                }
            }
            temp_array.sort(function(a, b){ return b - a; });
            delta = Math.floor(temp_array[0] / 2);
            
            
            x_min = p_coord[0] < x_min ? p_coord[0] : x_min;
            x_max = p_coord[0] > x_max ? p_coord[0] : x_max;
            y_min = p_coord[1] < y_min ? p_coord[1] : y_min;
            y_max = p_coord[1] > y_max ? p_coord[1] : y_max;
            x_min = -size > x_min - delta ? -size : x_min;
            x_max = size < x_max + delta ? size : x_max;
            y_min = -size > y_min - delta ? -size : y_min;
            y_max = size < y_max + delta? size : y_max;
            delta = (x_min == -size) || (x_max == size) || (y_min == -size) ||( y_max == size) ? 0 : delta;

            for(var x = x_min - delta; x <= x_max + delta; x++){
                for(var y = y_min - delta; y <= y_max + delta; y++){
                    if(!busy_point[x + " " + y]){
                        var temp = AppealPoint(x, y, alpha, R, weight_nodes, matrix_length); 
                        if(temp >= max_temp){
                            max_temp = temp;
                            p_coord = [x, y];
                        }
                    }
                }
            }
            R[alpha] = p_coord;
            busy_point[p_coord[0] + " " + p_coord[1]] = true;
            not_painted_vertex--;
        }

        for(var i = 0; i < R.length; i++){
            R[i][0] += Math.abs(x_min) + delta + 1; //+1 to pull back from the edge
            R[i][1] += Math.abs(y_min) + delta + 1;
        }
        
        return R;
    }




    this.apply = function() { 
        
        ///////////////////////////////////////////////////////////////////////////////////////////////
        /// main
        ///////////////////////////////////////////////////////////////////////////////////////////////
        var size_temp = 2 * Math.floor(Math.sqrt(nodes.length));

        /*
        An associative array of vertex indices of names
         */
        var number_nodes_label = {};
        for(var i = 0; i < nodes.length; i++){
            number_nodes_label[nodes[i].label] = i;
        }

        

        var neighbors = Neighbors(number_nodes_label);

        var result = MainDijkstrasAlgorithm(neighbors);
        var weight_nodes = result[0];
        var matrix_length = result[1];

        var R = Drawing(weight_nodes, matrix_length, neighbors, number_nodes_label);

        for(var i = 0; i < R.length; i++){
            nodes[i].x = R[i][0];
            nodes[i].y = R[i][1];
        } 
        return true;
    };
};