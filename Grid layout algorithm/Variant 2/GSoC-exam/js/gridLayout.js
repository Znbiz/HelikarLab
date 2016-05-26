function gridLayout() {}

gridLayout.calculate = function(nodes, edges, size) {

    var const_dmax = 0;
    var d_max = 1;


    // Функция расчёта весов рёбер для графа. Обход в глубину для определения степени близости двух вершин
    function WalkDepth(edges, R, nodes_number){
        var W = [];

        
        for(var i = 0; i < R.length; i++){
            var Wj = [];
            for(var j = 0; j < R.length; j++){
                    Wj[j] = -2;
            }
            W[i] = Wj;
        }

        for(var i = 0; i < edges.length; i++){
            for (var j = 0; j < edges.length; j++){
                if(edges[i].target.label == edges[j].source.label){
                    for(var k = 0; k < edges.length; k++){
                        if(edges[j].target.label == edges[k].source.label){
                            for(var z = 0; z < edges.length; z++){
                                if(edges[k].target.label == edges[z].source.label){
                                    W[nodes_number[edges[i].source.label]][nodes_number[edges[z].target.label]] = 0;
                                    W[nodes_number[edges[z].target.label]][nodes_number[edges[i].source.label]] = 0;
                                }
                            }
                            W[nodes_number[edges[i].source.label]][nodes_number[edges[k].target.label]] = 1;
                            W[nodes_number[edges[k].target.label]][nodes_number[edges[i].source.label]] = 1;
                        }
                    }
                    W[nodes_number[edges[i].source.label]][nodes_number[edges[j].target.label]] = 3;
                    W[nodes_number[edges[j].target.label]][nodes_number[edges[i].source.label]] = 3;
                }
            }
            W[nodes_number[edges[i].source.label]][nodes_number[edges[i].target.label]] = 5;
            W[nodes_number[edges[i].target.label]][nodes_number[edges[i].source.label]] = 5;
        }
        return W;
    }

   
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function Operator(R, number_label, p){
        var R_temp = JSON.parse(JSON.stringify(R));
        R_temp[number_label] = p;
        return R_temp;
    }

    function WeightR (R, matrix_weight){
        var score = 0;
        var d = 0;
        for(var i = 0; i < R.length; i++){
            for(var j = 0; j < i; j++){
                if((i != j) && (matrix_weight[i][j] != 0) ){
                    var dx = R[i][0] - R[j][0];
                    var dy = R[i][1] - R[j][1];
                    // d = Math.sqrt(dx*dx + dy*dy);
                    d = Math.abs(dx) + Math.abs(dy);
                    if(matrix_weight[i][j]>=const_dmax)
                    {
                        score += matrix_weight[i][j] * d;
                    } else {
                        score += matrix_weight[i][j] * Math.min(d, d_max);
                    }
                }
            }
        }
        return score;
    }

    function AdjacencyMatrix(number_nodes_label){
        var matrix = [];
        for (var i = 0; i < nodes.length; i++){
            var temp = [];
            for (var j = 0; j < nodes.length; j++){
                temp[j] = 0;
            }   
            matrix[i] = temp;
        }
        for (var i = 0; i < nodes.length; i++){
            matrix[i][i] = 1;
        }
       
        for(var i = 0; i < edges.length; i++){
            matrix [number_nodes_label[edges[i].source.label]] [number_nodes_label[edges[i].target.label]] = 1;
            matrix [number_nodes_label[edges[i].target.label]] [number_nodes_label[edges[i].source.label]] = 1;
        } 

        return matrix;
    }

    function CreateSimParametrsMatrix(number_nodes_label){
        var all_nodes = nodes.length;
        var matrix_weight_Sim = [];
        var neighbors_i = [];
        var neighbors_j = [];
        var Add_ji_intersection, Add_ij_union;

        var adjacency_matrix = AdjacencyMatrix(number_nodes_label);

        for (var i = 0; i < nodes.length; i++){
            var i_temp = [];
            for (var j = 0; j < nodes.length; j++){
                // если ребра между ними нет, то не считаем параметр ребра Sim
                var i_nodes = adjacency_matrix[i];
                var j_nodes = adjacency_matrix[j];
                Add_ij_union = 0;
                Add_ji_intersection = 0;
                for(var k = 0; k < nodes.length; k++){
                    if(i_nodes[k] || j_nodes[k]){
                        Add_ij_union++;
                    } 
                    if (i_nodes[k] && j_nodes[k]){
                        Add_ji_intersection++;
                    }
                }
                i_temp[j] = Add_ji_intersection / Add_ij_union;
            }
            matrix_weight_Sim[i] = i_temp;
        }
        return matrix_weight_Sim;
    }

    function WeightAlphaR(R, alpha_nodes_number, matrix_weight){
        var score = 0;
        var d = 0;
        for(var i = 0; i < R.length; i++){
            if(matrix_weight[alpha_nodes_number][i] != 0){
                var dx = R[alpha_nodes_number][0] - R[i][0];
                var dy = R[alpha_nodes_number][1] - R[i][1];
                // d = Math.sqrt(dx*dx + dy*dy);
                d = Math.abs(dx) + Math.abs(dy);
                if(matrix_weight[alpha_nodes_number][i]>=const_dmax)
                {
                    score += matrix_weight[alpha_nodes_number][i] * d;
                } else {
                    score += matrix_weight[alpha_nodes_number][i] * Math.min(d, d_max);
                }
            }
        }
        return score;
    }

    function VacantPoint(R){
        var vacant_point = [];
        for(var x = 0; x < size_temp; x++){
            for(var y = 0; y <size_temp; y++){
                var key = x + "_" + y;
                vacant_point[key] = [x, y];
            }
        }
        for (var i = 0; i < R.length; i++){
            var key = R[i][0] + "_" + R[i][1];
            delete vacant_point[key];
        }
        return vacant_point;
    }


    function RandomLayoutR(R){
        var R_temp = JSON.parse(JSON.stringify(R));
        var map = {};
        for(var i = 0; i < R.length; i++){
            while (true) {
                var x = Math.floor(size_temp * Math.random());
                var y = Math.floor(size_temp * Math.random());
                var key = x + " " + y;

                if (!map[key]) {
                    map[key] = true;
                    R_temp[i][0] = x;
                    R_temp[i][1] = y;
                    break;
                }
            }
        };
        return R_temp;
    }

    function Neighbor(R, p){
        var R_1 = JSON.parse(JSON.stringify(R));
        var map_vacant = VacantPoint(R_1);
        for(var i = 0; i < R_1.length; i++) {
            var e = R_1[i];
            var Eps = Math.random();
            if(Eps <= p){
                while (true) {
                    var x = Math.floor(size * Math.random());
                    var y = Math.floor(size * Math.random());
                    var key = x + "_" + y;

                    if (map_vacant[key]) {
                        var key_temp = e[0] + "_" + e[1];
                        delete map_vacant[key];
                        map_vacant[key_temp] = [x,y];
                        R_1[i][0] = x;
                        R_1[i][1] = y;
                        break;
                    }
                }
            }
        };
        return R_1;
    }

    function WeightRAlphaBeta(R, alpha_number, beta_number, matrix_weight){
        var score = 0;
        if(matrix_weight[alpha_number][beta_number] != 0) {
            var dx = R[alpha_number][0] - R[beta_number][0];
            var dy = R[alpha_number][1] - R[beta_number][1];
            // d = Math.sqrt(dx*dx + dy*dy);
            d = Math.abs(dx) + Math.abs(dy);
            if(matrix_weight[alpha_number][beta_number]>=const_dmax){
                score += matrix_weight[alpha_number][beta_number] * d;
            } else {
                score += matrix_weight[alpha_number][beta_number] * Math.min(d, d_max);
            }
        }
        return score;
    }

    function DeltaUpdate(R, beta_number, q_point, alpha_number, p_point, matrix_delta, matrix_weight){
        var res; 
        var p = p_point[0] + "_" + p_point[1];
        var q = q_point[0] + "_" + q_point[1];
        if(alpha_number == beta_number){
            res = matrix_delta[beta_number][p] - matrix_delta[beta_number][q];
        } else if ((alpha_number != beta_number) && (p != (R[beta_number][0] +"_"+R[beta_number][1]))) {
            var TERM = WeightRAlphaBeta(Operator(Operator(R, beta_number, q_point), alpha_number, p_point), alpha_number, beta_number, matrix_weight);
                    TERM -= WeightRAlphaBeta(Operator(R, beta_number, q_point), alpha_number, beta_number, matrix_weight);
                    TERM -= WeightRAlphaBeta(Operator(R, alpha_number, p_point), alpha_number, beta_number, matrix_weight);
                    TERM += WeightRAlphaBeta(R, alpha_number, beta_number, matrix_weight);
            res = matrix_delta[alpha_number][p] + TERM;  
        } else if((alpha_number != beta_number) && (p == (R[beta_number][0] +"_"+R[beta_number][1]))) {
            res = WeightAlphaR(Operator(Operator(R, beta_number, q_point), alpha_number, p_point), alpha_number, matrix_weight);
            res -= WeightAlphaR(Operator(R, beta_number, q_point), alpha_number, matrix_weight);
        }
        return res;
    }

    function LocalMin3(R_temp, matrix_weight, number_nodes_label){
        R = JSON.parse(JSON.stringify(R_temp));

        var f_0 = WeightR (R, matrix_weight);
        var vacant_point = VacantPoint(R);
        var beta_number = 0, q_point, q;
        var beta1_number = 0, q1_point, q1;
        var p_point;
        var matrix_delta = [];
        var delta_min = 0;
        var delta1_min;
        

        for(var alpha_number = 0; alpha_number < nodes.length; alpha_number++){
            matrix_delta[alpha_number] = {};
            var f_R = WeightAlphaR(R, alpha_number, matrix_weight);
            for(var p in vacant_point){
                p_point = vacant_point[p];
                matrix_delta[alpha_number][p] = WeightAlphaR(Operator(R, alpha_number, p_point), alpha_number, matrix_weight);
                matrix_delta[alpha_number][p] -= f_R;  
                if(matrix_delta[alpha_number][p] < delta_min){
                    delta_min = matrix_delta[alpha_number][p];
                    beta_number = alpha_number;
                    q = p;
                    q_point = p_point;
                }
            }
        }
        
        while(delta_min < 0){ 
            var matrix_delta_1 = []; 
            delta1_min = 0;
            matrix_delta = JSON.parse(JSON.stringify(matrix_delta));
            for(var alpha_number = 0; alpha_number < nodes.length; alpha_number++){
                // if(alpha_number == beta_number) continue ;
                matrix_delta_1[alpha_number] = {};
                for(var p in vacant_point){ 
                    if(p == q) continue ;
                    p_point = vacant_point[p];
                    matrix_delta_1[alpha_number][p] = DeltaUpdate(R, beta_number, q_point, alpha_number, p_point, matrix_delta, matrix_weight);
                    
                    if(matrix_delta_1[alpha_number][p] < delta1_min){
                        delta1_min = matrix_delta_1[alpha_number][p];
                        beta1_number = alpha_number;
                        q1 = p;
                        q1_point = p_point;
                    }
                }
                p = R[beta_number][0] +"_"+R[beta_number][1];
                p_point = R[beta_number];
                matrix_delta_1[alpha_number][p] = DeltaUpdate(R, beta_number, q_point, alpha_number, p_point, matrix_delta, matrix_weight);
                
                if(matrix_delta_1[alpha_number][p] < delta1_min){
                    delta1_min = matrix_delta_1[alpha_number][p];
                    beta1_number = alpha_number;
                    q1 = p;
                    q1_point = p_point;
                }
            }
            
            matrix_delta_1[beta_number][R[beta_number][0] +"_"+R[beta_number][1]] = - delta_min;
            R = Operator(R, beta_number, q_point);
            var vacant_point = VacantPoint(R);
            
            for(var alpha_number = 0; alpha_number < nodes.length; alpha_number++){
                // if(alpha_number == beta_number) continue ;
                for(var p in vacant_point){
                    matrix_delta[alpha_number][p] = matrix_delta_1[alpha_number][p];
                    delete matrix_delta[alpha_number][q];
                }
            }
            beta_number = beta1_number;
            q_point = q1_point;
            q = q1;
            delta_min = delta1_min; 
        }
        return [R, f_0 + delta1_min];
    }


    function Grid(R){
        var number_nodes_label = {};
        for(var i = 0; i < R.length; i++){
            number_nodes_label[R[i].label] = i;
        }

        // var matrix_weight = WalkDepth(edges, R, number_nodes_label);
        // var matrix_weight = AdjacencyMatrix(number_nodes_label)
        var matrix_weight = CreateSimParametrsMatrix(number_nodes_label)

        R_temp = JSON.parse(JSON.stringify(R));
        R = [];
        for(var i = 0; i < R_temp.length; i++){
            R[i] = [0,0];
        }

        R_temp = RandomLayoutR(R);

        var local_min = LocalMin3(R_temp, matrix_weight, number_nodes_label);
        var f_min = local_min[1];
        var R_min = local_min[0];
        var f;
        for(var i = 0; i < 0; i++){
            R_temp = Neighbor(R_temp, 0.55);
            local_min = LocalMin3(R_temp, matrix_weight, number_nodes_label);
            f = local_min[1];
            if(f < f_min){ 
                f_min = f;
                R_min = local_min[0];
            }
        }
       
        return R_min;
    }

    var size_temp = size;

    var R_min = Grid(nodes);

    for(var i = 0; i < R_min.length; i++){
        nodes[i].x = R_min[i][0];
        nodes[i].y = R_min[i][1];
    } 
}