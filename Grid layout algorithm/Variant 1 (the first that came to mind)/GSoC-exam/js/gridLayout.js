function gridLayout() {}

gridLayout.calculate = function(nodes, edges, size) {
    //naive solution that just fullfills the validity requirements
    //delete the code bellow and implement your solution
    //the resulting layout positions has to be stored in x and y properties of each node, each coordinate is an int value between 0 and size

var graph = {};
    for(var name in nodes){
        var name_n = nodes[name].label; // host Name
        graph[name_n] = {};
        // Count the number of adjacent vertices with name_n
        var neighbours = 0;
        var list_nodes = [];
        for(var edge in edges){
            if(edges[edge].source.label == name_n){
                // In calculating the vertices of the loop will not be considered
                if (edges[edge].source.label != edges[edge].target.label){
                    neighbours++;
                    list_nodes.push(edges[edge].target.label);
                }
            } else if (edges[edge].target.label == name_n){
                // In calculating the vertices of the loop will not be considered
                if (edges[edge].source.label != edges[edge].target.label){
                    neighbours++;
                    list_nodes.push(edges[edge].source.label);
                }
            }
        }
        graph[name_n]["list_nodes"] = list_nodes;
        graph[name_n]["weight"] = neighbours;
    }
    
    // Create an array of objects from the neighboring peaks: weight
    for(var temp in graph){
        var temp_list_nodes = [];
        for (var i in graph[temp].list_nodes){
            var node = graph[temp].list_nodes[i];
            temp_list_nodes.push({label:node,weight:graph[node].weight});
        }
        temp_list_nodes.sort(function(a,b){return (a.weight > b.weight)});
        graph[temp]["list_nodes"] = temp_list_nodes;
    }

    // Create an array of vertices ordered by descending scales
    var graph_mas = [];
    for(var node in graph){
        graph_mas.push({label: node, 
                        weight: graph[node].weight,
                        list_nodes: graph[node].list_nodes});
    }
    graph_mas.sort(function(a,b){return (a.weight <= b.weight)});

    var srednee = 0;

    // We give weight to the edges Sim graph_mas, graph
    function SimEdge2(){
        // It is necessary to calculate for each Sim formula rib
        // Sim(i,j) = |Adj(i) * Adj(j)|/|Adj(i) + Adj(j)|
        // Where Adj(i) - a plurality of node neighbors i

        var sum = 0;
        var n = 0;
        
        for (var i in edges){
            if (edges[i].source.label == edges[i].target.label) {
                continue;
            }
            var name_node_i = edges[i].source.label;
            var name_node_j = edges[i].target.label;
            var list_node_i = graph[name_node_i].list_nodes;
            var list_node_j = graph[name_node_j].list_nodes;
            var name_j_in_i; // name_node_j top of the index in the list list_node_i
            var name_i_in_j; // name_node_i top of the index in the list of list node j
            // |Adj(i) * Adj(j)|
            var intersection = 1;
            // |Adj(i) + Adj(j)|
            var union;
            var sim_i_j = 0;
            for(var ni in list_node_i){
                for(var nj in list_node_j){
                    if(list_node_i[ni].label == list_node_j[nj].label){
                        intersection++;
                    }
                    if(list_node_j[nj].label == name_node_i){
                        name_i_in_j = nj;
                    }
                }
                if(list_node_i[ni].label == name_node_j){
                    name_j_in_i = ni;
                }
            }
            union = list_node_i.length + list_node_j.length - intersection;

            union = ((union == 0)? 1 : union);
            sim_i_j = intersection / union;
            sum+=sim_i_j;
            n++;
            
            graph[name_node_i].list_nodes[name_j_in_i]["sim"] = sim_i_j ;
            graph[name_node_i]["sim_run"] = 0;
            graph[name_node_j].list_nodes[name_i_in_j]["sim"] = sim_i_j;
            graph[name_node_j]["sim_run"] = 0;      
        }
        for (var node_name in graph){
            graph[node_name].list_nodes.sort(function(a,b){return (a.sim > b.sim)});
        }
        srednee = sum/n;
    }

    function Score(node_name){
        var score = 0;
        var list_nodes = graph[node_name].list_nodes
        var n = 100;
        for(var node in list_nodes){
            var sl = list_nodes[node].label;
            if (graph[sl].coordinat_bool) {
                n--;
                var s = graph[sl].coordinat;
                var t = graph[node_name].coordinat;
                var dx = t[0] - s[0];
                var dy = t[1] - s[1];
                
                score += Math.pow(dx,2) + Math.pow(dy,2);
                if(n == 0){
                    return score;
                }
            }
        }
        return score;
    }

    var map = {}; // The array of pixels employed

    // Specifies the coordinates of the adjacent peaks
    function Coordinat(x_shift, y_shift, node_label){

        var x;
        var y;
        var key;
        var min_score = 100000000000;
        var score;  
        var xy;
        
        var approximation = size;
        if(!map[x_shift + " " + y_shift]){
            return [x_shift,y_shift];
        }
        for (var diametr = 1; diametr < size; diametr++){
            for(var i = -diametr; i <= diametr; i++){
                for(var j = -diametr; j <= diametr; j++ ){
                    x = x_shift + i;
                    y = y_shift + j;
                    key = x + " " + y;
                    if((0 <= x) && (x < size) && (0 <= y) && (y < size)&& (!map[key])){
                        graph[node_label].coordinat = [x,y];
                        score = Score(node_label);

                        if(score<min_score){
                            min_score=score;
                            xy = [x,y];
                            approximation++;
                        } else if (score>=min_score){
                            approximation--;
                            if (approximation == 0){
                                return xy;
                            }
                        }
                    }
                }
            }
        }
        return xy;
    }

    function CoordinatStar(x_shift, y_shift){
        var x = x_shift;
        var y = y_shift;

        key = x + " " + y;
        if((0 <= x) && (x < size) && (0 <= y) && (y < size) && (!map[key])){
            map[key] = true;
            return [x,y];
        }
        for(var diametr = 1; diametr < size; diametr++){
            y = y_shift + diametr;
            for(var i = -diametr+1; i <= diametr; i++){
                x = x_shift + i;
                key = x + " " + y;
                if((0 <= x) && (x < size) && (0 <= y) && (y < size) && (!map[key])){
                    return [x,y];
                }
            }
            x = x_shift + diametr;
            for(var i = -diametr+1; i <= diametr; i++){
                y = y_shift - i;
                key = x + " " + y;
                if((0 <= x) && (x < size) && (0 <= y) && (y < size) && (!map[key])){
                    return [x,y];
                }
            }
            y = y_shift - diametr;
            for(var i = -diametr+1; i <= diametr; i++){
                x = x_shift - i;
                key = x + " " + y;
                if((0 <= x) && (x < size) && (0 <= y) && (y < size) && (!map[key])){
                    return [x,y];
                }
            }
            x = x_shift - diametr;
            for(var i = -diametr+1; i <= diametr; i++){
                y = y_shift + i;
                key = x + " " + y;
                if((0 <= x) && (x < size) && (0 <= y) && (y < size) && (!map[key])){
                    return [x,y];
                }
            }
        }
    }






    // Calculation of coordinates for adjacent vertices
    function CoordinatesWeight(node){
        
        if(edges.length > 900){
            // Asking for vertex coordinates, if they are not set
            if(!graph[node.label]["coordinat_bool"]){
                graph[node.label]["coordinat_bool"] = true;
                var centr = Math.floor(size/2);

                var xy = CoordinatStar(centr, centr);
                var key = xy[0] + " " + xy[1];
                map[key] = true;
                graph[node.label]["coordinat"] = xy;
            }
            for(var i in node.list_nodes){
                var name_node = node.list_nodes[i].label;
                if(!graph[name_node]["coordinat_bool"]){
                    graph[name_node]["coordinat_bool"] = true;
                    var xy = CoordinatStar(graph[node.label]["coordinat"][0], graph[node.label]["coordinat"][1]);
                    var key = xy[0] + " " + xy[1];
                    map[key] = true;
                    graph[name_node]["coordinat"] = xy;
                } 
            }
        } else {
            // Asking for vertex coordinates, if they are not set
            if(!graph[node.label]["coordinat_bool"]){
                graph[node.label]["coordinat_bool"] = true;
                var centr = Math.floor(size/2);

                var xy = Coordinat(centr, centr, node.label);
                var key = xy[0] + " " + xy[1];
                map[key] = true;
                graph[node.label]["coordinat"] = xy;
            }
            var srednee2 = srednee/2;
            for(var i in node.list_nodes){
                var name_node = node.list_nodes[i].label;
                if((!graph[name_node]["coordinat_bool"]) && (node.list_nodes[i].sim > srednee2)){
                    graph[name_node]["coordinat_bool"] = true;
                    graph[name_node].sim_run = node.list_nodes[i].sim;
                    var r = i;
                    var xy = Coordinat(graph[node.label]["coordinat"][0], graph[node.label]["coordinat"][1], name_node);
                    var key = xy[0] + " " + xy[1];
                    map[key] = true;
                    graph[name_node]["coordinat"] = xy;
                } 
            }
        }
    }

    // Accepts input to an array of objects of type 
    // [{label: NAME, weight: INT, list_nodes: [{label:NAME, weight: INT}]},{...}]
    function CoordinatesNode(graph_mas){
        for (var node in graph_mas){
            CoordinatesWeight(graph_mas[node]);
        }
    }

    if(edges.length <= 900){
         SimEdge2();
    }
    CoordinatesNode(graph_mas);

    nodes.forEach(function(e) {
        e.x = graph[e.label].coordinat[0];
        e.y = graph[e.label].coordinat[1];
    });
}