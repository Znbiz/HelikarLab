/**
*  The algorithm is taken from an article http://bioinformatics.oxfordjournals.org/content/21/9/2036.full
*/

function gridLayout() {}

gridLayout.calculate = function(nodes, edges, size) {
    /**
     * Быстрое глубокое клоирование
     * @type {Object}
     */
    var cloner = {
        _clone: function _clone(obj) {
            if (obj instanceof Array) {
                var out = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    var value = obj[i];
                    out[i] = (value !== null && typeof value === "object") ? _clone(value) : value;
                }
            } else {
                var out = {};
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        var value = obj[key];
                        out[key] = (value !== null && typeof value === "object") ? _clone(value) : value;
                    }
                }
            }
            return out;
        },

        clone: function(it) {
            return this._clone({
            it: it
            }).it;
        }
    };

    /*
        if the weight between the vertices less than "const_dmax", then select the minimum value 
        between "d_max" and the distance between the vertices 
     */
    var const_dmax = 0;
    var d_max = 1;

    /**
     * The function of calculating the weights for the edges of the graph. Walk in depth to determine the degree of proximity of the two peaks
     * 
     * @param {array} edges - an array of ribs
     * @param {array} R - an array of vertex coordinates
     * @param {array} nodes_number - associative array "name of vertex": "index of vertex"
     * @return {array} The array of weights between the vertices of the graph
     */
    function WalkDepth(edges, nodes_number){
        var W = [];
        
        for(var i = 0; i < nodes.length; i++){
            var Wj = [];
            for(var j = 0; j < nodes.length; j++){
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

    /**
     * Changes "number_label" coordinates of the vertices in the new coordinates "p"
     *  
     * @param {array} R - an array of vertex coordinates
     * @param {number} number_label - index of vertex
     * @param {array} p - new coordinates
     * @return {array} New layout
     */ 
    function Operator(R, number_label, p){
        var R_temp = cloner.clone(R);
        R_temp[number_label] = p;
        return R_temp;
    }

    /**
     * Counts how graph costs
     * 
     * @param {array} R - an array of vertex coordinates 
     * @param {array} matrix_weight - Matrix weights
     * @return {number} Cost graph 
     */
    function WeightR (R, matrix_weight){
        var score = 0;
        var d = 0;
        for(var i = 0; i < R.length; i++){
            for(var j = 0; j < i; j++){
                if((i != j) && (matrix_weight[i][j] != 0) ){
                    var dx = R[i][0] - R[j][0];
                    var dy = R[i][1] - R[j][1];
                    
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

    /**
     * Counts how costs graph with respect to the alpha_nodes_number vertex
     * 
     * @param {array} R - an array of vertex coordinates 
     * @param {number} alpha_nodes_number - index of vertex
     * @param {array} matrix_weight - Matrix weights
     * @return {number} Cost graph 
     */
    function WeightAlphaR(R, alpha_nodes_number, matrix_weight){
        var score = 0;
        var d = 0;
        for(var i = 0; i < R.length; i++){
            if(matrix_weight[alpha_nodes_number][i] != 0){
                var dx = R[alpha_nodes_number][0] - R[i][0];
                var dy = R[alpha_nodes_number][1] - R[i][1];
                
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

    /**
     * Calculate a set of free points
     * 
     * @param {array} R - an array of vertex coordinates 
     * @return {array} set of free points
     */
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

    /**
     * Randomly place the vertices on the grid
     * 
     * @param {array} R - an array of vertex coordinates 
     * @return {array} new an array of vertex coordinates 
     */
    function RandomLayoutR(R){
        var R_temp = cloner.clone(R);
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

    /**
     * Move casual tops, in a randomly selected spot available
     * 
     * @param {array} R - an array of vertex coordinates 
     * @param {nuumber} p - the likelihood of selecting the vertex
     * @return {array} new an array of vertex coordinates 
     */
    function Neighbor(R, p){
        var R_1 = cloner.clone(R);
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

    /**
     * Cost of distance between two vertices
     * 
     * @param {array} R - an array of vertex coordinates
     * @param {number} alpha_number - index of vertex
     * @param {number} beta_number - index of vertex
     * @param {array} matrix_weight - Matrix weights
     * @return {number} Cost graph 
     */
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

    /**
     * Now we deduce the update formulas for the Δ-matrix. Suppose a node β 
     * moving to a point q is the best least change of layout R, i.e.
     * 
     * @param {array} R - an array of vertex coordinates
     * @param {number} beta_number - index of vertex
     * @param {array} q_point - vertex coordinates
     * @param {number} alpha_number - index of vertex
     * @param {array} p_point - vertex coordinates
     * @param {array} matrix_delta - delta matrix
     * @param {array} matrix_weight - Matrix weights
     * @return {number} a new value for the element delta matrix
     */
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

    /**
     * Search for a local minimum
     * 
     * @param {array} R_temp - an array of vertex coordinates
     * @param {array} matrix_weight - matrix weights
     * @param {array} number_nodes_label - index of vertex
     * @return {array} Returns a new layout and its cost
     */
    function LocalMin(R_temp, matrix_weight, number_nodes_label){
        R = cloner.clone(R_temp);

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

            /*
            Change the delta matrix
             */
            for(var alpha_number = 0; alpha_number < nodes.length; alpha_number++){
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

                /*
                Calculating the cost of the nodes when moving to a new free point. 
                At this point, this point is not yet available and because of this 
                it is not processed in the main loop.
                 */
                var p = R[beta_number][0] +"_"+R[beta_number][1];
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
            
            /*
            Change set vacant spots. And change the graph P, acting on his operator "Rearranged tops."
             */
            vacant_point[R[beta_number][0] +"_"+R[beta_number][1]] = R[beta_number];
            R = Operator(R, beta_number, q_point);
            delete vacant_point[q];
            
            matrix_delta = matrix_delta_1;
            
            beta_number = beta1_number;
            q_point = q1_point;
            q = q1;
            delta_min = delta1_min; 
        }
        return [R, f_0 + delta1_min];
    }

    /**
     * Search low
     * 
     * @param  {number} T_max - the initial temperatures 
     * @param  {number} T_min - the terminating temperatures
     * @param  {array} R - an array of vertex coordinates
     * @param  {number} n_e - the number of repetitive trials
     * @param  {number} r_c - the cooling rate
     * @param  {number} p - the layout perturbation rate is set to be
     * @param  {array} matrix_weight - matrix weights
     * @param  {array} number_nodes_label - index of vertex
     * @return {array} minimal layout
     */
    function gridLayout(T_max, T_min, R, n_e, r_c, p, matrix_weight, number_nodes_label){
        /*
        An array with a random coordinates of vertices
         */
        R = RandomLayoutR(R);

        var T = T_max;
        var f;

        var local_res = LocalMin(R, matrix_weight, number_nodes_label);
        var f_min = f = local_res[1];
        var R_min = local_res[0];
        while(T > T_min){
            for(var i = 0; i < n_e; i++){
                /*
                We change the coordinates of some vertices of the graph "R" with probability "p"
                 */
                var R1 = Neighbor(R, p);
                var f1 = LocalMin(R, matrix_weight, number_nodes_label);
                var Eps = Math.random();
                if(Eps < Math.exp((f - f1) / T)){
                    f = f1;
                    R = R1;
                }
                if(f < f_min){
                    f_min = f;
                    R_min = R;
                }
            }
            T = r_c * T;
        }
       
        return R_min;
    }

    var size_temp = size;

    /*
    An associative array of vertex indices of names
     */
    var number_nodes_label = {};
    for(var i = 0; i < nodes.length; i++){
        number_nodes_label[nodes[i].label] = i;
    }

    /*
    The weight matrix based on M
     */
    var matrix_weight = WalkDepth(edges, number_nodes_label);

    var R = [];
    for(var i = 0; i < nodes.length; i++){
        R[i] = [0,0];
    }
    
    var array_f = [];
    for(var i = 0; i < 10; i++){
        R = RandomLayoutR(R);
        array_f[i] = WeightR (R, matrix_weight);
    }

    /*
    simulation parameters
     */
    var T_min = 0.1;
    var f_max = Math.max.apply(null, array_f);
    var f_min = Math.min.apply(null, array_f);
    var T_max = (f_max - f_min) / 2;
    var r_c = 0.8;
    var n_e = 10;
    var p = 0.55;
    
    var R_min = gridLayout(T_max, T_min, R, n_e, r_c, p, matrix_weight, number_nodes_label);

    for(var i = 0; i < R_min.length; i++){
        nodes[i].x = R_min[i][0];
        nodes[i].y = R_min[i][1];
    } 

}