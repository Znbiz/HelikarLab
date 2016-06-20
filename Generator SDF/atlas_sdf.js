function generate_SDF_atlas_font(options){

    /**
     * Counting function SDF
     * @param  {array} grid    - an array of colors
     * @param  {numbe} width   - image Width
     * @param  {numbe} height  - image Height
     * @return {array} An array of distances for each pixel
     */
    function signed_distance_fields(grid, width, height) {

        var Vector2 = function (x, y) {
            this.x = x || 0;
            this.y = y || 0;
        };

        Vector2.prototype = {
            set: function (x, y) {
                this.x = x;
                this.y = y;
                return this;
            },
            copy: function (v) {
                this.x = v.x;
                this.y = v.y;
                return this;
            },
            lengthSq: function () {
                return this.x * this.x + this.y * this.y;
            }
        };

        var x, y;
        var grid1 = [];
        var grid2 = [];
        var cell, index;

        var outside = 10000;
        var outofrange = new Vector2(outside, outside);
        var other = new Vector2();

        // some functions

        function grid_get(grid, x, y) {
            if (x < 0 || y < 0 || x > (width - 1) || y > (height - 1)){
                return outofrange;
            }
            return grid[y * width + x];   
        }

        function grid_put(grid, x, y, p) {
            grid [y * width + x] = p;
        }

        function grid_compare(g, cell, x, y, offsetX, offsetY) {
            other.copy(grid_get(g, x + offsetX, y + offsetY));

            other.x += offsetX;
            other.y += offsetY;

            if (other.lengthSq() < cell.lengthSq()) {
                cell.copy(other);
            }

            return cell;
        }


        function propagate(grid) {

            var p;

            // pass 0
            for (y=0; y < height; y++) {

                for (x=0; x < width; x++) {
                    p = grid_get(grid, x, y);
                    p = grid_compare(grid, p, x, y, -1,  0);
                    p = grid_compare(grid, p, x, y,  0, -1);
                    p = grid_compare(grid, p, x, y, -1, -1);
                    p = grid_compare(grid, p, x, y,  1, -1);

                    grid_put(grid, x, y, p);
                }

                for (x = width - 1; x >= 0; x--) {
                    p = grid_get(grid, x, y);
                    p = grid_compare(grid, p, x, y, 1,  0);
                    grid_put(grid, x, y, p);
                }

            }

            // pass 1
            for (y = height - 1; y >= 0; y--) {
                for (x = width - 1; x >= 0; x--) {
                    p = grid_get(grid, x, y);
                    p = grid_compare(grid, p, x, y,  1,  0);
                    p = grid_compare(grid, p, x, y,  0,  1);
                    p = grid_compare(grid, p, x, y, -1,  1);
                    p = grid_compare(grid, p, x, y,  1,  1);

                    grid_put(grid, x, y, p);
                }

                for (x = 0; x < width; x++) {
                    p = grid_get(grid, x, y);
                    p = grid_compare(grid, p, x, y, -1,  0);
                    grid_put(grid, x, y, p);
                }
            }
        }

        // Start the work

        // step 1 generate grids.
        for (y = 0; y < height; y++) {
         
            for (x = 0; x < width; x++) {

                index = y * width + x;

                if (grid[index]) {
                    grid_put(grid1, x, y, new Vector2(0, 0));
                    grid_put(grid2, x, y, new Vector2(outside, outside));
                } else {
                    grid_put(grid1, x, y, new Vector2(outside, outside));
                    grid_put(grid2, x, y, new Vector2(0, 0));
                }
            }
        }

        // step 2 propagate distances
        propagate(grid1);
        propagate(grid2);

        var distanceFields = [];
        var dist1, dist2, dist;

        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                
                dist1 = Math.sqrt(grid_get(grid1, x, y).lengthSq());
                dist2 = Math.sqrt( grid_get(grid2, x, y).lengthSq());
                dist = dist1 - dist2;
                
                index = y * width + x;

                distanceFields[index] = dist;
            }
        }

        return distanceFields;
    };

    /**
     * Create atlas for one character and return SDF
     * @param  {string} family - family font 
     * @param  {number} size   - size font
     * @param  {char}   char   - char
     * @param  {number} step   - side of the square canvas size in which will be drawn symbol
     * @return {object} Returns an image with a symbol processed using SDF. Returns metrics for this symbol      
     */
    function atlas_one_character(family, size, char, step){ 
        var canvas = document.createElement('canvas');
        canvas.width  = step;
        canvas.height = step;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, step, step);

        ctx.font = size + 'px ' + family;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';

        var x = Math.floor(step / 2);
        var y = x;
        ctx.fillText(char, x, y);
        

        canvas = SDF(canvas);

        var limit = size;
        
        var pix = ctx.getImageData(0, 0, step, step);
        var k_left = 0;
        var k_right = 0;
        var flag_left = true, flag_right = true;
        for(var j = 0, j_1 = step - 1; (j < step / 2) && (j_1 > step / 2); j++, j_1--){
            for(var i = 0; i < step; i++){
                if(flag_right){
                    var k_1 = (i * step + j_1) * 4;
                    var temp = pix.data[k_1];
                    if(limit < temp){
                        flag_right = false;
                        k_right = j_1;
                    }
                }
                if(flag_left){
                    var k = (i * step + j) * 4;
                    var temp = pix.data[k];
                    if(limit < temp){
                        flag_left = false;
                        k_left = j;
                    }
                }
            }
            if(! (flag_left || flag_right)) break;
        }
        
        var delta = k_left - (step - k_right);
        
        //  advance - character width
        var advance = (k_right - k_left);
       
        var result = {
            imgData : ctx.getImageData(0, 0, step, step),
            metric  : [step, step, k_left, k_right, advance, 0, 0]
        };

        return result;
    }

    /**
     * create atlas
     * @param  {object} canvas - canvas
     * @param  {string} family - family font
     * @param  {array}  shape  - size canvas
     * @param  {number} step   - side of the square canvas size in which will be drawn 1 symbol 
     * @param  {number} size   - size font
     * @param  {array}  chars  - array chars
     * @return {object} Returns the canvas and metrics for each symbol
     */
    function atlas(canvas, family, shape, step, size, chars) {

        var metrics = {
            family : family,
            style  : "Regular",
            size   : size,
            chars  : {}
        };


        shape = shape.slice();
        canvas.width  = shape[0];
        canvas.height = shape[1];

        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        var x = 0;
        var y = 0;
        

        for (var i = 0; i < chars.length; i++) {
            var temp = atlas_one_character(family, size, chars[i], step);
            var imgData = temp.imgData;
            metrics.chars[chars[i]] = temp.metric;
            metrics.chars[chars[i]][5] = x;
            metrics.chars[chars[i]][6] = y;
            ctx.putImageData(imgData, x, y);
            
            if ((x += step) > shape[0] - step) {
                x = 0;
                y += step;
            } 
        }

        var result = {
            metrics : metrics,
            canvas  : canvas
        };

        return result;
    };


    /**
     * Image processing method SDF
     * @param {object} canvas - canvas
     * @return {object} canvas
     */
    function SDF(canvas){
        var ctx = canvas.getContext('2d');
        var width = canvas.width;
        var height = canvas.height;

        var pix = ctx.getImageData(0, 0, width, height);
        var imgData = [];
        
        for(var y = 0; y < height; y++){
            for(var x = 0; x < width; x++){
                var i = ((y * height) + x) * 4;
                var j = ((y * height) + x);
                imgData[j] = pix.data[i];
            }
        }

        imgData = signed_distance_fields(imgData, width, height)
        

        var max = 0;
        var min = 0;
        for(var i = 0; i < imgData.length; i++){
            if (imgData[i] > max) {
                max = imgData[i]; 
            }
            if (imgData[i] < min) {
                min = imgData[i]; 
            }
        }
        min = Math.abs(min);

        for(var i = 0; i < imgData.length; i++ ){
            if(imgData[i] < 0){
                imgData[i] = 0.5 + imgData[i] / min / 1.3;
            } else if(imgData[i] > 0){
                imgData[i] = 0.5 + imgData[i] / max;
            } else {
                imgData[i] = 0.5;
            }
        }

        var imgData1 = ctx.createImageData(width, height);

        for(var y = 0; y < height; y++){
            for(var x = 0; x < width; x++){
                var i = ((y * height) + x) * 4;
                var j = ((y * height) + x);
                imgData1.data[i]     = 255 - imgData[j] * 255;
                imgData1.data[i + 1] = 255 - imgData[j] * 255;
                imgData1.data[i + 2] = 255 - imgData[j] * 255;
                imgData1.data[i + 3] = 255; 
            }
        }

        ctx.putImageData(imgData1, 0, 0);

        return canvas;
    };

    /**
     * Translate array of character codes in the character array
     * @param {array} index_chars - code range
     * @return {array} character array
     */
    function Chars_array(index_chars){

        if (!Array.isArray(index_chars)) {
            index_chars = String(index_chars).split('');
        } else
        if (index_chars.length === 2
            && typeof index_chars[0] === 'number'
            && typeof index_chars[1] === 'number'
        ) {
            var newchars = [];

            for (var i = index_chars[0], j = 0; i <= index_chars[1]; i++) {
                newchars[j++] = String.fromCharCode(i);
            }
        }
        return newchars;
    }
    
    var canvas = document.createElement('canvas');
    var size   = options.size;
    var chars  = [options.start, options.end];

    var chars_array = Chars_array(chars);

    var delta = Math.floor(Math.sqrt(chars_array.length))+1;
    var delta_1 = size + Math.floor(size / 5);
    var step   = delta_1; // The square in which the symbol will be drawn
    var shape  = [delta*delta_1, delta*delta_1];
    var family = options.font_family;
    

    var result = atlas(canvas, family, shape, step, size, chars_array);
    canvas = result.canvas;

    return {img : canvas.toDataURL("image/png"), metrics: result.metrics};
}