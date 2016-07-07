function generate_SDF_atlas_font(options){
    /**
     * The creation and initialization of context webgl. Creating shaders
     * @param  {object} canvas - canvas
     * @return {object} Return canvas
     */
    function init_gl(canvas) {

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
            "        min = 1.0 - 1.0 / pow(2.71828, 1.0 / min);",
            "        gl_FragColor = vec4(min, min, min, 1.0);",
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
            "        min = 1.0 - min * 4.5;",
            "        gl_FragColor = vec4(min, min, min, 1.0);",
            "    }",
            "}"];   

        /**
         * Function to create the webgl context
         * @param  {object} canvas - canvas
         * @return {object} webgl context
         */
        function initGL(canvas) {
            var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
            var context = null;
            for(var i = 0; i < names.length; i++) {
                try {
                    context = canvas.getContext(names[i], { antialias: false });
                } catch(e) { }
                if(context) {
                    break;
                }
            }
            if(context) {
                context.viewportWidth = canvas.width;
                context.viewportHeight = canvas.height;
            } else {
                alert("Failed to create webgl context");
            }

            return context;
        }


        /**
         * Create shader
         * @param  {const} type    - type shader (fragment or vertex)
         * @param  {array} text_sh - text shader code
         * @return {object} shader
         */
        function getShader(gl, type, text_sh) {
            var str = "";
            for(var i = 0; i < text_sh.length; i++) {
                str += text_sh[i];
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




        function initShaders(gl) {

            var fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, shader_fs);
            var vertexShader = getShader(gl, gl.VERTEX_SHADER, shader_vs);

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

            return gl;
        }

        function initBuffers(gl) {
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

            return gl;
        }

        var gl = initGL(canvas);
        gl = initShaders(gl);
        gl = initBuffers(gl);
        return {gl: gl, canvas: canvas};
    }

    /**
     * Creating SDF atlas fonts and metrics for Atlas
     * @param  {string} family_option      - type font
     * @param  {array} chars_array_option - the character set
     * @param  {number} size_font_option   - size font
     * @param  {object} canvas             - canvas
     * @param  {object} gl                 - context webgl
     * @return {object} SDF atlas fonts and metrics for Atlas
     */
    function webGL_SDF(family_option, chars_array_option, size_font_option, canvas, gl) {

        var chars_array = chars_array_option;
        var delta = Math.floor(Math.sqrt(chars_array.length) + 1);
        var family = family_option;
        var metrics = {
                family : family,
                style  : "Regular",
                size   : size_font,
                chars  : {}
        };
        var size_font = size_font_option;
        var delta_1 = size_font + Math.floor(size_font / 8);
        var step   = delta_1; 
        var shape  = [delta*delta_1, delta*delta_1];
        canvas.width = shape[0];
        canvas.height = shape[1] ;
        var texture;
        
        /**
         * Create atlas char and metrcs atlas
         * @return {object} canvas
         */
        function create_atlas_char_and_metrcs_atlas(){

            var canvas = document.createElement('canvas');
            canvas.width  = shape[0];
            canvas.height = shape[1];

            var ctx = canvas.getContext('2d');

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, shape[0], shape[1]);

            ctx.font = size_font + 'px ' + family;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';


            var half_step = step / 2;
            var quarter_step = step / 4;
            var x = half_step;
            var y = half_step;
            var x_result = 0;
            var y_result = 0;
            var chars = {};

            for (var i = 0; i < chars_array.length; i++) {
                var text = ctx.measureText(chars_array[i]); // TextMetrics object
                var advance = text.width + quarter_step;
                var padding = (step - advance) / 2;
                padding = padding < 0 ? 0 : padding;
                chars[chars_array[i]] = [step, step, padding, padding, advance, x_result, y_result];
                ctx.fillText(chars_array[i], x, y);
                
                x_result += step;
                if ((x += step) > shape[0] - half_step) {
                    x = half_step;
                    y += step;
                    x_result = 0;
                    y_result += step;
                } 
            }
            metrics.chars = chars;
            return canvas;
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
            
            image = create_atlas_char_and_metrcs_atlas(); 

            handleTextureLoaded(image, texture);  
            drawScene(); 
        }

        function webGLStart() {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);

            gl.viewportWidth = shape[0];
            gl.viewportHeight = shape[1];

            setTextures();
            return canvas;
        }
        
        webGLStart();

        return {metrics : metrics, canvas  : canvas};
    }


    /**
     * It divides a character set for the portion to the graphics card does not fall
     * @param  {number} number_char_portions - The number of characters on one canvas when sent to GPU
     * @param  {string} family               - type font
     * @param  {number} size                 - size font
     * @param  {array} chars_array           - chars array
     * @return {object} sdf canvas atlas and metrics atlas 
     */
    function divide_into_portions (number_char_portions, family, size, chars_array) {
        var canvas = document.createElement('canvas');
        var x = 0, y = 0;
        var delta = Math.floor(Math.sqrt(number_char_portions)+1);
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


        /*
         Initialize the canvas for painting
         */        
        var canvas_atlas = document.createElement('canvas');
        var gl_or_canvas = init_gl(canvas_atlas);
        var gl = gl_or_canvas.gl;
        var canvas_atlas = gl_or_canvas.canvas;

        for(var i = 0; i < Math.floor(chars_array.length / number_char_portions) + 1; i++) {
            /*
             process the characters through a portion sdf 
             */
            var chars = [];
            for(var j = 0; (j < number_char_portions) && (i * number_char_portions + j < chars_array.length); j++) {
                chars[j] = chars_array[i * number_char_portions + j];
            }

            
            var res = webGL_SDF(family, chars, size, canvas_atlas, gl);
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

    var result = divide_into_portions (50, family, size, chars_array);

    return {img : result.canvas, metrics: result.metrics};
}