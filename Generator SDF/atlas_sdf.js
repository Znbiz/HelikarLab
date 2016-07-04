function generate_SDF_atlas_font(options){

        function webGL_SDF(family_option, chars_array_option, size_font_option) {


        var chars_array = chars_array_option;
        var delta = Math.floor(Math.sqrt(chars_array.length) + 1);
        var family = family_option;
        var size_font = size_font_option;
        var delta_1_resultat = size_font + Math.floor(size_font / 8);
        var step_resultat   = delta_1_resultat; 
        var shape_resultat  = [delta*delta_1_resultat, delta*delta_1_resultat];


        var size = 50;
        var delta_1 = size + Math.floor(size / 8);
        var step   = delta_1; 
        var shape  = [delta*delta_1, delta*delta_1];

        var shader_vs = ["attribute vec3 aVertexPosition;",
            "varying vec2 vTextureCoords;",
            "void main(void) {",
            "    gl_Position = vec4(aVertexPosition, 1.0);",
            "    vTextureCoords = 0.5 * vec2(aVertexPosition.x + 1.0, aVertexPosition.y + 1.0);",
            "}"];

        var shader_fs = ["precision highp float;",
            "uniform vec2 uFloatTextureSize;",
            "const int size = 20;",
            "uniform sampler2D uSampler;",
            "varying vec2 vTextureCoords;",
            "void main(void) {",
            "    float min = 99999.0;",
            "    vec2 temp_coord;",
            "    float d;",
            "    float step = 1.0 / uFloatTextureSize[0];",
            "    float neighborhood = 10.0 * step;", // The neighborhood search the nearest opposite point
            "    temp_coord.x = vTextureCoords.x - neighborhood;",
            "    if(texture2D(uSampler, vTextureCoords).r > 0.5){",
            "        for(int i = 0; i < size; i++) {",
            "            temp_coord.y = vTextureCoords.y - neighborhood;",
            "            for(int j = 0; j < size; j++) {",
            "                if(texture2D(uSampler, temp_coord).r < 0.05){",
            "                    d = pow(temp_coord.x - vTextureCoords.x, 2.0);",
            "                    d += pow(temp_coord.y - vTextureCoords.y, 2.0);",
            "                    if(d < min){",
            "                        min = d;",
            "                    }",
            "                }",
            "                temp_coord.y += step;",
            "            }",    
            "            temp_coord.x += step;",
            "        }",
            "        min = pow(min, 0.45);",
            "        gl_FragColor = vec4(0.0, min, 0.0, 1.0);",
            "    } else {",
            "        for(int i = 0; i < size; i++) {",
            "            temp_coord.y = vTextureCoords.y - neighborhood;",
            "            for(int j = 0; j < size; j++) {",
            "                if(texture2D(uSampler, temp_coord).r > 0.95){",
            "                    d = pow(temp_coord.x - vTextureCoords.x, 2.0);",
            "                    d += pow(temp_coord.y - vTextureCoords.y, 2.0);",
            "                    if(d < min){",
            "                        min = d;",
            "                    }",
            "                }",
            "                temp_coord.y += step;",                    
            "            }",
            "            temp_coord.x += step;",
            "        }",   
            "        min = pow(min, 0.27);",
            "        gl_FragColor = vec4(min, 0.0, 0.0, 1.0);",
            "    }",
            "}"];

        function create_atlas_char(){


            var canvas = document.createElement('canvas');
            canvas.width  = shape[0];
            canvas.height = shape[1];

            var ctx = canvas.getContext('2d');


            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, shape[0], shape[1]);

            ctx.font = size + 'px ' + family;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';


            var half_step = step / 2;
            var x = half_step;
            var y = half_step;

            for (var i = 0; i < chars_array.length; i++) {
                ctx.fillText(chars_array[i], x, y);
                
                if ((x += step) > shape[0] - half_step) {
                    x = half_step;
                    y += step;
                } 
            }
            return canvas;
        }

        var gl;
        var shaderProgram;
        var texture;
        var vertexBuffer;
        var canvas;

        function initGL(canvas) {
            try {
                gl = canvas.getContext("experimental-webgl");
            } catch (e) {
            }
            if (!gl) {
                alert("Could not initialise WebGL, sorry :-(");
            }
        }


        function getShader(type, text_sh) {
            var str = "";
            for(var i = 0; i < text_sh.length; i++) {
                str += text_sh[i] + "\r\n";
            }

            var shader;
            shader = gl.createShader(type);

            gl.shaderSource(shader, str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        }




        function initShaders() {
            var fragmentShader = getShader(gl.FRAGMENT_SHADER, shader_fs);
            var vertexShader = getShader(gl.VERTEX_SHADER, shader_vs);

            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert("Could not initialise shaders");
            }

            gl.useProgram(shaderProgram);

            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        }

        function initBuffers() {
            var vertices =[
                    -1, -1, 0,
                    -1, 1, 0,
                    1, 1, 0,
                    1, -1, 0
                    ];
            vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            vertexBuffer.itemSize = 3;

            var indices = [0, 1, 2, 2, 3, 0];
            indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            indexBuffer.numberOfItems = indices.length; 
        }


        function drawScene() {
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.drawElements(gl.TRIANGLES, indexBuffer.numberOfItems, gl.UNSIGNED_SHORT,0);
        }

        function handleTextureLoaded(image, texture) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            var textureSizeLocation = gl.getUniformLocation(shaderProgram, "uFloatTextureSize");
            gl.uniform2f(textureSizeLocation, image.width, image.height);
        }

        function setTextures(){
            texture = gl.createTexture();
            
            image = create_atlas_char(); 

            handleTextureLoaded(image, texture);  
            drawScene(); 
        }



        function webGLStart() {
            canvas = document.createElement('canvas');
            canvas.width = shape[0];
            canvas.height = shape[1];
            initGL(canvas);
            initShaders();
            initBuffers();

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);

            gl.viewportWidth = shape[0];
            gl.viewportHeight = shape[1];

            setTextures();

            return canvas;
        }

        function SDF(img) {
            var canvas = document.createElement('canvas');
            canvas.width = shape_resultat[0];
            canvas.height = shape_resultat[1];
            var ctx = canvas.getContext('2d');
            var width = shape_resultat[0];
            var height = shape_resultat[1];
            ctx.drawImage(img, 0, 0, shape_resultat[0], shape_resultat[1]);
            var pix = ctx.getImageData(0, 0, width, height);
            var imgData = [];
            
            for(var y = 0; y < height; y++){
                for(var x = 0; x < width; x++){
                    var temp = (y * height) + x;
                    var i = temp * 4;
                    var j = temp;
                    if(pix.data[i] == 0){
                        imgData[j] = 0 - pix.data[i + 1];
                    } else {
                        imgData[j] = pix.data[i];
                    }
                }
            }

            /*
              Generate image in sdf format
             */

            var max = 0;
            var min = 0;
            for(var i = 0; i < imgData.length; i++){
                imgData[i] = imgData[i] >= 0 ? imgData[i] : -imgData[i]
                if (imgData[i] > max) {
                    max = imgData[i]; 
                }
                if (imgData[i] < min) {
                    min = imgData[i]; 
                }
            }
            min = Math.abs(min);

            for(var i = 0; i < imgData.length; i++ ){
                if(imgData[i] <= 0){
                    imgData[i] = (1  - Math.exp(min / imgData[i]));
                }
            }
            max = 0;
            for(var i = 0; i < imgData.length; i++){
                if (imgData[i] > max) {
                    max = imgData[i]; 
                }
            }

            var temp = 1147.5 / max;
            for(var i = 0; i < imgData.length; i++ ){
                imgData[i] = 255 - (imgData[i]) * temp ; // temp: / max * 1147.5,  1147.5 = 255 * 4.5
            }

            var imgData1 = ctx.createImageData(width, height);

            for(var y = 0; y < height; y++){
                var y_temp = y * height;
                for(var x = 0; x < width; x++){
                    var temp = y_temp + x;
                    var i = temp * 4;
                    var j = temp;
                    imgData1.data[i]     = imgData[j]
                    imgData1.data[i + 1] = imgData[j]
                    imgData1.data[i + 2] = imgData[j]
                    imgData1.data[i + 3] = 255; 
                
                }
            }

            ctx.putImageData(imgData1, 0, 0);

            /*
             We believe metric for the picture to sdf
             */
            
            var metrics = {
                family : family,
                style  : "Regular",
                size   : size_font,
                chars  : {}
            };

            
            var x = 0, y = 0;
            var chars = {};

            /*
             Loop through each character area
             */
            for (var char = 0; char < chars_array.length; char++) {

                var k_left = 0;
                var k_right = 0;
                var flag_left = true, flag_right = true;
                for(var j = x, j_1 = x + step_resultat - 1; j < j_1; j++, j_1--){
                    for(var i = y; i < y + step_resultat; i++){
                        if(flag_right){
                            var k_1 = i * step_resultat + j_1;
                            var temp = imgData[k_1];
                            if(125 < temp){
                                flag_right = false;
                                k_right = j_1;
                            }
                        }
                        if(flag_left){
                            var k = i * step_resultat + j;
                            var temp = imgData[k];
                            if(125 < temp){
                                flag_left = false;
                                k_left = j;
                            }
                        }
                    }
                    if(! (flag_left || flag_right)) break;
                }

                k_left -= x;
                k_right -= x;
                
                //  advance - character width
                var advance = (k_right - k_left);
                chars[chars_array[char]] = [step_resultat, step_resultat, k_left, k_right, advance, x, y];
                if ((x += step_resultat) > shape_resultat[0] - step_resultat) {
                    x = 0;
                    y += step_resultat;
                } 
            }
            metrics.chars = chars;
           
            var result = {
                metrics : metrics,
                canvas  : canvas
            };
            return result;
        }


        var imgSDF = webGLStart();
        var result = SDF(imgSDF);
        return result
    }


    /**
     * It divides a character set for the portion to the graphics card does not fall
     * @param  {[type]} number_char_portions [description]
     * @param  {[type]} family               [description]
     * @param  {[type]} size                 [description]
     * @param  {[type]} chars_array          [description]
     * @return {[type]}                      [description]
     */
    function divide_into_portions (number_char_portions, family, size, chars_array) {
        var canvas = document.createElement('canvas');
        var x = 0, y = 0;
        var delta = Math.floor(Math.sqrt(number_char_portions) + 1);
        var delta_1 = size + Math.floor(size / 8);
        var shape_resultat  = [delta*delta_1, delta*delta_1];
        canvas.width = (Math.floor(Math.sqrt(chars_array.length / number_char_portions))+1) * shape_resultat[0];
        canvas.height = (Math.floor(Math.sqrt(chars_array.length / number_char_portions))+1) * shape_resultat[1];
        var ctx = canvas.getContext('2d');
        var metrics = {
            family : family,
            style  : "Regular",
            size   : size,
            chars  : {}
        }

        for(var i = 0; i < Math.floor(chars_array.length / number_char_portions) + 1; i++) {
            /*
             process the characters through a portion sdf 
             */
            var chars = [];
            for(var j = 0; (j < number_char_portions) && (i * number_char_portions + j < chars_array.length); j++) {
                chars[j] = chars_array[i * number_char_portions + j];
            }
            var res = webGL_SDF(family, chars, size);
            ctx.drawImage(res.canvas, x, y);

            /*
             change the metric
             */
            for(var char in res.metrics.chars) {
                metrics.chars[char] = res.metrics.chars[char];
                metrics.chars[char][6] += y;
                metrics.chars[char][5] += x;
            }
            if ((x += shape_resultat[0]) > canvas.width - shape_resultat[0]) {
                x = 0;
                y += shape_resultat[1];
            } 
        }

        return {canvas: canvas, metrics: metrics}
    }

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
    
    
    
    var size   = options.size;
    var chars  = [options.start, options.end];

    var chars_array = Chars_array(chars);

    var family = options.font_family;

    var number_char_portions = options.number_char_portions;

    var result = divide_into_portions (number_char_portions, family, size, chars_array);

    return {img : result.canvas, metrics: result.metrics};
}