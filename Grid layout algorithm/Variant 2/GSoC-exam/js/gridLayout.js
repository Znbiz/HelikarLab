function gridLayout() {}

gridLayout.calculate = function(nodes, edges, size) {

    //  Макет
    var Layout_R = JSON.parse(JSON.stringify(nodes));
    // Вес графа
    var Weight_R = 0;
    // Матрица весов, связь между узлами
    var W;

    var d_max = 5;
    var const_dmax = 0
    // Массив вершин {Name:int}
    var nodes_number = {};

    // Функция рандомно рассполагающая граф
    function RandomLayout(R){
        var R_temp = JSON.parse(JSON.stringify(R));
        var map = {};
        R_temp.forEach(function(e) {
            while (true) {
                var x = Math.floor(size * Math.random());
                var y = Math.floor(size * Math.random());
                var key = x + " " + y;

                if (!map[key]) {
                    map[key] = true;
                    e.x = x;
                    e.y = y;
                    return;
                }
            }
        });
        return R_temp;
    }

    function CountWeightEdge(R){
        var score = 0;
        var d_ri_rj = 0;
        var alpha, beta;
        console.log(edges)
        for(var edge = 0; edge < edges.length; edge++){
            for(var i = 0; i < R.length; i++){
                if (edges[edge].source.label == R[i].label){
                    alpha = R[i];
                    break;
                }
            }
            for(var i = 0; i < R.length; i++){
                if (edges[edge].target.label == R[i].label){
                    beta = R[i];
                    break;
                }
            }
            var dx = alpha.x - beta.x;
            var dy = alpha.y - beta.y;
            d_ri_rj = Math.sqrt(dx*dx + dy*dy);
            score += d_ri_rj;
        }
        return score;
    }

    // Функция стоимости графа
    function CountWeight(R){
        var score = 0;
        var d_ri_rj = 0;
        for(var j = 0; j < R.length; j++){
            for(var i = 0; i < j; i++){
                var dx = R[i].x - R[j].x;
                var dy = R[i].y - R[j].y;
                d_ri_rj = Math.sqrt(dx*dx + dy*dy);
                // score += d_ri_rj;
                if(W[i][j]>=const_dmax)
                {
                    score += W[i][j] * d_ri_rj;
                } else {
                    score += W[i][j] * Math.min(d_ri_rj, d_max);
                }
            }
        }
        return score;
    }

    // Обход в глубину для определения степени близости двух вершин
    function WalkDepth(edges, W){
        for(var i = 0; i < edges.length; i++){
            for (var j = 0; j < edges.length; j++){
                if(edges[i].target.label == edges[j].source.label){
                    for(var k = 0; k < edges.length; k++){
                        if(edges[j].target.label == edges[k].source.label){
                            for(var z = 0; z < edges.length; z++){
                                if(edges[k].target.label == edges[z].source.label){
                                    W[nodes_number[edges[i].source.label]][nodes_number[edges[z].target.label]] = -1;
                                    W[nodes_number[edges[z].target.label]][nodes_number[edges[i].source.label]] = -1;
                                }
                            }
                            W[nodes_number[edges[i].source.label]][nodes_number[edges[k].target.label]] = 0;
                            W[nodes_number[edges[k].target.label]][nodes_number[edges[i].source.label]] = 0;
                        }
                    }
                    W[nodes_number[edges[i].source.label]][nodes_number[edges[j].target.label]] = 1;
                    W[nodes_number[edges[j].target.label]][nodes_number[edges[i].source.label]] = 1;
                }
            }
            W[nodes_number[edges[i].source.label]][nodes_number[edges[i].target.label]] = 3;
            W[nodes_number[edges[i].target.label]][nodes_number[edges[i].source.label]] = 3;
        }
        return W;
    }

    // Функция расчёта весов рёбер для графа
    function CalculationWeights(edges, R){
        var W = [];
        
        for(var i = 0; i < R.length; i++){
            var Wj = [];
            for(var j = 0; j < R.length; j++){
                    Wj[j] = -2;
            }
            W[i] = Wj;
        }
        
        return WalkDepth(edges, W);
    }

    // Функция возращает массив свободных точек false- занято, true- свободно
    function MapVacant(R){
        var R_temp = JSON.parse(JSON.stringify(R));
        var map_vacant = {};
        for(var x = 0; x < size; x++){
            for(var y = 0; y < size; y++){
                var key = x + " " + y;
                map_vacant[key] = true;
            }
        }
        for(var i = 0; i < R.length; i++) {
            var e = R_temp[i];
            var key = e.x + " " + e.y;
            map_vacant[key] = false;
        };
        return map_vacant;
    }

    function Neighbor(R, p){
        var R_1 = JSON.parse(JSON.stringify(R));
        var map_vacant = MapVacant(R_1);
        for(var i = 0; i < R_1.length; i++) {
            var e = R_1[i];
            var Eps = Math.random();
            if(Eps <= p){
                while (true) {
                    var x = Math.floor(size * Math.random());
                    var y = Math.floor(size * Math.random());
                    var key = x + " " + y;

                    if (map_vacant[key]) {
                        var key_temp = e.x + " " + e.y;
                        map_vacant[key_temp] = true;
                        map_vacant[key] = false;
                        R_1[i].x = x;
                        R_1[i].y = y;
                        break;
                    }
                }
            }
        };
        return R_1;
    }

    function fAlphaBeta(alpha, beta, R){
        var alpha_temp;
        var beta_temp;
       for(var i = 0; i < R.length; i++) {
            var e = JSON.parse(JSON.stringify(R[i]));
            if(alpha.label == e.label){
                alpha_temp = JSON.parse(JSON.stringify(e));
            } else if (beta.label == e.label){
                beta_temp = JSON.parse(JSON.stringify(e));
            }
        };
        var dx = alpha_temp.x - beta_temp.x;
        var dy = alpha_temp.y - beta_temp.y;
        var d = Math.sqrt(dx*dx + dy*dy);
        if(W[nodes_number[alpha_temp.label]][nodes_number[beta_temp.label]]>=const_dmax)
        {
            var score = W[nodes_number[alpha_temp.label]][nodes_number[beta_temp.label]] * d;
        } else {
            var score = W[nodes_number[alpha_temp.label]][nodes_number[beta_temp.label]] * Math.min(d, d_max);
        }
        
        return score;
    }

    function FAlpha(R, alpha){
        var score = 0;
        for(var i = 0; i < R.length; i++){
            if(alpha.label == R[i].label){
                alpha = JSON.parse(JSON.stringify(R[i]));
            }
        }
        for (var i = 0; i < R.length; i++){
            if(alpha.label != R[i].label){
                var dx = alpha.x - R[i].x;
                var dy = alpha.y - R[i].y;
                var d = Math.sqrt(dx*dx + dy*dy);
                if(W[nodes_number[alpha.label]][nodes_number[R[i].label]]>=const_dmax)
                {
                    score += W[nodes_number[alpha.label]][nodes_number[R[i].label]] * d;
                } else {
                    score += W[nodes_number[alpha.label]][nodes_number[R[i].label]] * Math.min(d, d_max);
                }
            }
        } 
        return score;
    }

    function TOperator(alpha, p, R){
        var R_temp = JSON.parse(JSON.stringify(R));
        for(var i = 0; i < R_temp.length; i++) {
            if(R_temp[i].label == alpha.label){
                R_temp[i].x = p[0];
                R_temp[i].y = p[1];
                return R_temp;
            }
        };
        return R_temp;
    }

    function DeltaAlphaP(alpha, p, R){
        return (CountWeight(TOperator(alpha, p, R)) - CountWeight(R));
    }

    function DeltaMatrix(R){
        var R_temp = JSON.parse(JSON.stringify(R));
        var alpha, p;
        var map_vacant = MapVacant(R_temp);
        var delta;
        var i = 0;
        for(var i = 0; i < R_temp.length; i++) {
            var e = R_temp[i];
            for(var x = 0; x < size; x++){
                for(var y = 0; y < size; y++){
                    alpha = e;
                    p = [e.x, e.y];
                    if(map[e.x + " " + e.y]){
                        delta[i++] = {"alpha": alpha.label,
                                      "p": [p[0],p[1]],
                                      "delta_alpha_p": DeltaAlphaP(alpha, p, R_temp)
                                     };
                    }
                }
            }
        };
        return delta;
    }

    // function DeltaBetaQ(R){
    //     var delta = DeltaMatrix(R);
    //     var min = delta[0].delta_alpha_p;
    //     for(var i = 0; i < delta.length; i++){
    //         if(delta[i].delta_alpha_p < min){
    //             min = delta[0].delta_alpha_p;
    //         }
    //     }
    //     return min;
    // }

    function DeltaAlphaPTBetaQ(alpha, beta, p, q, R){
        var result;
        for (var i = 0; i < R.length; i++){
            if (beta.label == R[i].label){
                beta = JSON.parse(JSON.stringify(R[i]));
                break;
            }
        }
        if((alpha.label != beta.label) && (p[0] != beta.x) && (p[1] != beta.y)){
            var TERM = fAlphaBeta(alpha, beta, TOperator(alpha, p, TOperator(beta, q, R)));
            TERM -= fAlphaBeta(alpha, beta, TOperator(beta, q, R));
            TERM -= fAlphaBeta(alpha, beta, TOperator(alpha, p, R));
            TERM += fAlphaBeta(alpha, beta, R);
            result = DeltaAlphaP(alpha, p, R) + TERM;
        } else if (alpha.label == beta.label){
            result = DeltaAlphaP(beta, p, R) - DeltaAlphaP(beta, q, R); 
        } else {
            result = FAlpha(TOperator(alpha, p, TOperator(beta, q, R)), alpha);
            result -= FAlpha(TOperator(beta, q, R), alpha);
        }
        return result;
    }



    function LocalMin(R){
        var f_0 = CountWeight(R);
        var D_min = 0;
        var D_1_min;
        var D_beta_q;
        var R_1 = JSON.parse(JSON.stringify(R));
        var beta = {}, beta_1;
        var q = [];
        var q_1 = [];
        // Массив занятых/пустых точек
        var map = MapVacant(R_1);
        var map_1 = JSON.parse(JSON.stringify(map));
        var alpha;
        var p = [];

        for(var i = 0; i < R_1.length; i++) {
            alpha = JSON.parse(JSON.stringify(R_1[i]));
            for(var x = 0; x < size; x++){
                for(var y = 0; y < size; y++){
                    var key = x + " " + y;
                    if (map[key]) {
                        p = [x, y];
                        var D_alpha_p = FAlpha(TOperator(alpha, p, R_1),alpha) - FAlpha(R_1,alpha);
                        if(D_alpha_p < D_min){
                            D_min = D_alpha_p;
                            beta = JSON.parse(JSON.stringify(alpha));
                            q = JSON.parse(JSON.stringify(p));
                        }
                    }
                }
            }
        };
        beta_1 = JSON.parse(JSON.stringify(alpha)); 
        var D_1_alpha_p;
        while(D_min < 0){
            D_1_min = 0;
            for(var i = 0; i < R_1.length; i++) {
               alpha = JSON.parse(JSON.stringify(R_1[i]));
                if(alpha.label != beta.label){ 
                    for(var x = 0; x < size; x++){
                        for(var y = 0; y < size; y++){
                            var key = x + " " + y; // p[0] + " " + p[1]
                            p = [x,y];
                            if ((map_1[key]) && (q[0] != p[0]) && (q[1] != p[1])) { 
                                D_1_alpha_p = DeltaAlphaPTBetaQ(alpha, beta, p, q, TOperator(beta, q, R_1));
                                // D_1_alpha_p =  FAlpha(TOperator(alpha, p, R_1),alpha) - FAlpha(R_1,alpha);
                                if(D_1_alpha_p < D_1_min){ 
                                    D_1_min = D_1_alpha_p;
                                    beta_1 = JSON.parse(JSON.stringify(alpha));
                                    q_1[0] = p[0];
                                    q_1[1] = p[1];
                                }
                            }
                        }
                    }
                }
            };
            var temp = beta.x + " " + beta.y;
            map_1[temp] = true;
            var temp = q[0] + " " + q[1];
            map_1[temp] = false;
            R_1 = TOperator(beta, q, R_1);
            beta = JSON.parse(JSON.stringify(beta_1));
            q[0] = q_1[0];
            q[1] = q_1[1];
            D_min = D_1_min;
        }
        R = R_1;
        return [f_0 + D_min, R_1];
    }

    function LocalMin0(R){
        var f_0 = CountWeight(R);
        var R_1 = JSON.parse(JSON.stringify(R));
        var f_min;
        var map = MapVacant(R_1);
        var f_trial;
        var beta, alpha;
        var p, q;
        

        while(true){
            f_0 = CountWeight(R_1);
            f_min = f_0;
            for(var i = 0; i < R_1.length; i++){
                alpha = JSON.parse(JSON.stringify(R_1[i]));
                for(var x = 0; x < size; x++){
                    for(var y = 0; y < size; y++){
                        var key = x + " " + y;
                        if(map[key]){
                            p = [x, y]; 
                            f_trial = CountWeight(TOperator(alpha, p, R_1));
                            if(f_trial < f_min){
                                f_min = f_trial;
                                beta = JSON.parse(JSON.stringify(alpha));
                                q = JSON.parse(JSON.stringify(p));
                                
                            }
                        }
                    }
                }
            }
            if(f_min >= f_0){
                R = R_1;
                return [f_min,R_1];
            }
            R_1 = TOperator(beta, q, R_1);
            var temp = beta.x + " " + beta.y;
            map[temp] = true;
            var temp = q[0] + " " + q[1];
            map[temp] = false;
        }
    }
    // Эвристический метод импликации отжига для глобальной оптимизации
    // функции отжига
    function GridLayot(T_max, T_min, n_e, r_c, p, Layout_R){
        var T = T_max;
        var R = JSON.parse(JSON.stringify(Layout_R));
        var result = LocalMin(R);
        var f = result[0];
        R = result[1];
        var f_min = f;
        var f_1;
        var R_min = JSON.parse(JSON.stringify(R));
        while(T > T_min){
            for(var i = 0; i < n_e; i++){
                var R_1 = Neighbor(R,p);
                result = LocalMin(R_1);
                f_1 = result[0];
                R_1 = result[1];
                var Eps = Math.random();
                if(Eps < Math.exp((f-f_1) / T)){
                    f = f_1;
                    R = JSON.parse(JSON.stringify(R_1));
                }
                if (f_1 < f_min){
                    f_min = f_1;
                    R_min = JSON.parse(JSON.stringify(R_1));
                    
                }
            }
            T = r_c * T;
        }
        return R_min;
    }

    // Массив вершин {Name:int}
    for (var i = 0; i < Layout_R.length; i++){
        nodes_number[Layout_R[i].label] = i;
    }

    W = CalculationWeights(edges,Layout_R);

    Layout_R = RandomLayout(Layout_R);
    
    Weight_R = CountWeight(Layout_R);

    var f = [];
    for(var i = 0; i < 10; i++){
        f[i] = CountWeight(RandomLayout(Layout_R));
    }
    var T_max = (Math.max.apply(null, f) - Math.min.apply(null, f)) / 2;

    Layout_R = GridLayot(0.2, 0.1, 5, 0.1, 0.55, Layout_R);
    // Layout_R = LocalMin0(Layout_R)
    for(var i = 0; i < nodes.length; i++){
        nodes[i].x = Layout_R[i].x;
        nodes[i].y = Layout_R[i].y;
    } 
}