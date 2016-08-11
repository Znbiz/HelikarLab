if(R[i]){
                var SpN_i = weight_nodes[i];
                var SpN_alpha = weight_nodes[alpha];
                var k = matrix_length[alpha][i];
                var length = Math.sqrt((R[i][0] - x)*(R[i][0] - x) + (R[i][1] - y)*(R[i][1] - y));
                var hit = (length >= k); 
                if(hit){
                    var l1 = k / Math.abs(SpN_i - SpN_alpha) <= length ? 1 : 0;
                    appeal += l1 / length / k + SpN_i / k;
                } else{
                    var l1 = k / Math.abs(SpN_i - SpN_alpha) <= length ? 1 : 0;
                    appeal -= l1 / length / k - SpN_i / k;
                }
            }



            if(R[i]){
                var SpN_i = weight_nodes[i];
                var SpN_alpha = weight_nodes[alpha];
                var k = matrix_length[alpha][i];
                var length = Math.sqrt((R[i][0] - x)*(R[i][0] - x) + (R[i][1] - y)*(R[i][1] - y));
                var hit = (length >= k); 
                if(hit){
                    var l1 = Math.abs(SpN_i - SpN_alpha) /k <= length ? 1 : Math.abs(SpN_i - SpN_alpha) /k;
                    appeal += (l1 / length / k + SpN_i / k / k);
                } else{
                    var l1 = Math.abs(SpN_i - SpN_alpha) /k <= length ? 1 : Math.abs(SpN_i - SpN_alpha) /k;
                    appeal -= (l1 / length / k - SpN_i / k/ k);
                }
            }

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