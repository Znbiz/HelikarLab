/**
 *  Copyright (c) 2016, Helikar Lab.
 *  All rights reserved.
 *
 *  This source code is licensed under the GPLv3 License.
 *  Author: David Tichy
 */

ccNetViz = function(canvas, options) {
    options = options || {};
    options.styles = options.styles || {};

    var backgroundStyle = options.styles.background = options.styles.background || {};
    var backgroundColor = new ccNetViz.color(backgroundStyle.color || "rgb(255, 255, 255)");

    

    var nodeStyle = options.styles.node = options.styles.node || {};
    nodeStyle.minSize = nodeStyle.minSize != null ? nodeStyle.minSize : 6;
    nodeStyle.maxSize = nodeStyle.maxSize || 16;
    nodeStyle.color = nodeStyle.color || "rgb(255, 255, 255)";
    /*
     Switch SDF text (znbiz)
     */
    // nodeStyle.flagSDF  = options.SDF || false;
    // nodeStyle.atlasSDF  = options.SDFatlas || null;
    
    // nodeStyle.metricsSDF = options.SDFmetrics || null;
   
    var atlas = {options: {
                        size: 100,
                        font_family: "Arial",
                        start: 1,
                        end: 256
                    },
                 atlas: null
                }; 


    if (nodeStyle.label) {
        var s = nodeStyle.label;
        s.color = s.color || "rgb(120, 120, 120)";
        s.font = s.font || "11px Arial, Helvetica, sans-serif";
        /*
         Switch SDF text (znbiz)
         */
        
        if(s.SDF) {
            s.flagSDF = s.SDF.SDF || false;
            s.SDFatlas = s.SDF.SDFatlas || false;
            if(s.SDFatlas) {
                var image = new Image();
                image.src = s.SDFatlas;
                s.atlasSDF = image;
            }
            s.metricsSDF = s.SDF.SDFmetrics || null;
        }
    }

    var edgeStyle = options.styles.edge = options.styles.edge || {};
    edgeStyle.width = edgeStyle.width || 1;
    edgeStyle.color = edgeStyle.color || "rgb(204, 204, 204)";

    if (edgeStyle.arrow) {
        var s = edgeStyle.arrow;
        s.minSize = s.minSize != null ? s.minSize : 6;
        s.maxSize = s.maxSize || 12;
        s.aspect = 1;
    }

    var offset = 0.5 * nodeStyle.maxSize;

    this.set = function(nodes, edges, layout) {
        this.nodes = nodes = nodes || [];
        this.edges = edges = edges || [];

        var lines = [], curves = [], circles = [];

        var init = function()  {
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].index = i;
            }
            if (extensions.OES_standard_derivatives) {
                var map = {};
                for (var i = 0; i < edges.length; i++) {
                    var e = edges[i];
                    (map[e.source.index] || (map[e.source.index] = {}))[e.target.index] = true;
                }
                for (var i = 0; i < edges.length; i++) {
                    var target, e = edges[i];

                    if (e.source.index === e.target.index) {
                        target = circles;
                    }
                    else {
                        var m = map[e.target.index];
                        target = m && m[e.source.index] ? curves : lines;
                    }
                    target.push(e);
                }
            }
            else {
                for (var i = 0; i < edges.length; i++) {
                    var e = edges[i];
                    e.source.index !== e.target.index && lines.push(e);
                }
            }
        };

        var normalize = function(a, b)  {
            var x = b.x - a.x;
            var y = b.y - a.y;
            var sc = 1 / Math.sqrt(x*x + y*y);
            return { x: sc * x, y: sc * y };
        };

        init();

        layout && new ccNetViz.layout[layout](nodes, edges).apply() && ccNetViz.layout.normalize(nodes);

        scene.nodes.set(gl, options.styles, textures, nodes.length && !nodes[0].color ? nodes : [], function(style)  {return {
            set: function(v, e, iViI)  { 
                var x = e.x;
                var y = e.y;
                ccNetViz.primitive.vertices(v.position, iViI[0], x, y, x, y, x, y, x, y);
                ccNetViz.primitive.vertices(v.textureCoord, iViI[0], 0, 0, 1, 0, 1, 1, 0, 1);
                ccNetViz.primitive.quad(v.indices, iViI[0], iViI[1]);
            }};}
        );

        scene.nodesColored.set(gl, options.styles, textures, nodes.length && nodes[0].color ? nodes : [], function(style)  {return {
            set: function(v, e, iViI)  {
                var x = e.x;
                var y = e.y;
                var c = e.color;
                ccNetViz.primitive.vertices(v.position, iViI[0], x, y, x, y, x, y, x, y);
                ccNetViz.primitive.vertices(v.textureCoord, iViI[0], 0, 0, 1, 0, 1, 1, 0, 1);
                ccNetViz.primitive.colors(v.color, iViI[0], c, c, c, c);
                ccNetViz.primitive.quad(v.indices, iViI[0], iViI[1]);
            }};}
        );

        if (nodeStyle.label) {
            texts.clear();
            scene.labels.set(gl, options.styles, textures, nodes, function(style)  {
                // it was before: texts.setFont(style.font);
                texts.setFont(style);
                style.texture = texts.texture;
                return {
                    set: function(v, e, iViI)  {
                        var x = e.x;
                        var y = e.y;
                        ccNetViz.primitive.vertices(v.position, iViI[0], x, y, x, y, x, y, x, y);
                        if (style.flagSDF) {
                            /*
                             Draw the text letter by letter
                             */
                            var array_meta_char = [];
                            var width = 0; 
                            var height = 0;
                            var left, right, bottom, top;

                            for(var i = 0; i < e.label.length; i++) {
                                var char           = e.label[i];
                                array_meta_char[i] = texts.get(char);
                                height             = height > array_meta_char[i].height ? height : array_meta_char[i].height;
                                if(array_meta_char[i].horiAdvance) {
                                    /*
                                     We prepare for the atlas coordinates, which generate in our library ccNetViz
                                     */
                                    width         += array_meta_char[i].horiAdvance + array_meta_char[i].horiBearingX;
                                } else {
                                    /*
                                     We prepare the coordinates for the atlas, which is created on the server
                                     */
                                    width         += array_meta_char[i].width;
                                }
                            }

                            var dx = x <= 0.5 ? 0 : -width ;
                            var dy = y <= 0.5 ? height / 2 : -height; 

                            for(var i = 0; i < array_meta_char.length; i++) {
                                width  = array_meta_char[i].width;
                                height = array_meta_char[i].height;
                                left   = array_meta_char[i].left;
                                right  = array_meta_char[i].right;
                                bottom = array_meta_char[i].bottom;
                                top    = array_meta_char[i].top;


                                var temp_dy = dy;
                                if(array_meta_char[i].horiAdvance) {
                                    /*
                                     We prepare for the atlas coordinates, which generate in our library ccNetViz
                                     */
                                    var horiBearingX = array_meta_char[i].horiBearingX;
                                    var horiBearingY = array_meta_char[i].horiBearingY;
                                    var horiAdvance = array_meta_char[i].horiAdvance;
                                    dy -= (height - horiBearingY);
                                    dx += horiBearingX      
                                }
                                ccNetViz.primitive.vertices(v.relative, iViI[0], dx, dy, width + dx, dy, width + dx, height + dy, dx, height + dy);
                                dy = temp_dy;
                                ccNetViz.primitive.vertices(v.textureCoord, iViI[0], left, bottom, right, bottom, right, top, left, top);
                                ccNetViz.primitive.quad(v.indices, iViI[0], iViI[1]);
                                if(i < array_meta_char.length - 1){
                                    iViI[0] += 4;
                                    iViI[1] += 6;
                                    ccNetViz.primitive.vertices(v.position, iViI[0], x, y, x, y, x, y, x, y);
                                }

                                if(array_meta_char[i].horiAdvance) {
                                    dx += horiAdvance; 
                                } else {
                                    dx += width;
                                }
                            }
                        } else {
                            /*
                             Draw text on one texture
                             */
                            var t = texts.get(e.label);
                            var dx = x <= 0.5 ? 0 : -t.width;
                            var dy = y <= 0.5 ? 0 : -t.height; 
                            ccNetViz.primitive.vertices(v.relative, iViI[0], dx, dy, t.width + dx, dy, t.width + dx, t.height + dy, dx, t.height + dy);
                            ccNetViz.primitive.vertices(v.textureCoord, iViI[0], t.left, t.bottom, t.right, t.bottom, t.right, t.top, t.left, t.top);
                            ccNetViz.primitive.quad(v.indices, iViI[0], iViI[1]);
                        }
                    }}
            });
            texts.bind();
        }

        scene.lines.set(gl, options.styles, textures, lines, function(style)  {return {
            set: function(v, e, iV, iI)  {
                var s = e.source;
                var t = e.target;
                var d = normalize(s, t);  
                ccNetViz.primitive.vertices(v.position, iV, s.x, s.y, s.x, s.y, t.x, t.y, t.x, t.y);
                ccNetViz.primitive.vertices(v.normal, iV, -d.y, d.x, d.y, -d.x, d.y, -d.x, -d.y, d.x);
                ccNetViz.primitive.quad(v.indices, iV, iI);
            }};}
        );

        if (extensions.OES_standard_derivatives) {
            scene.curves.set(gl, options.styles, textures, curves, function(style)  {return {
                    numVertices: 3,
                    numIndices: 3,
                    set: function(v, e, iV, iI)  {
                        var s = e.source;
                        var t = e.target;
                        var d = normalize(s, t);
                        ccNetViz.primitive.vertices(v.position, iV, s.x, s.y, 0.5 * (t.x + s.x), 0.5 * (t.y + s.y), t.x, t.y);
                        ccNetViz.primitive.vertices(v.normal, iV, 0, 0, d.y, -d.x, 0, 0);
                        ccNetViz.primitive.vertices(v.curve, iV, 1, 1, 0.5, 0, 0, 0);
                        ccNetViz.primitive.indices(v.indices, iV, iI, 0, 1, 2);
                    }
                };}
            );

            scene.circles.set(gl, options.styles, textures, circles, function(style)  {return {
                    set: function(v, e, iV, iI)  {
                        var s = e.source;
                        var d = s.y < 0.5 ? 1 : -1;
                        ccNetViz.primitive.vertices(v.position, iV, s.x, s.y, s.x, s.y, s.x, s.y, s.x, s.y);
                        ccNetViz.primitive.vertices(v.normal, iV, 0, 0, 1, d, 0, 1.25 * d, -1, d);
                        ccNetViz.primitive.vertices(v.curve, iV, 1, 1, 0.5, 0, 0, 0, 0.5, 0);
                        ccNetViz.primitive.quad(v.indices, iV, iI);
                    }
                };}
            );
        }

        if (edgeStyle.arrow) {
            var set = function(v, e, iV, iI, dx, dy)  {
                var tx = e.target.x;
                var ty = e.target.y;
                ccNetViz.primitive.vertices(v.position, iV, tx, ty, tx, ty, tx, ty, tx, ty);
                ccNetViz.primitive.vertices(v.direction, iV, dx, dy, dx, dy, dx, dy, dx, dy);
                ccNetViz.primitive.vertices(v.textureCoord, iV, 0, 0, 1, 0, 1, 1, 0, 1);
                ccNetViz.primitive.quad(v.indices, iV, iI);
            };

            scene.lineArrows.set(gl, options.styles, textures, lines, function(style)  {return {
                set: function(v, e, iV, iI)  {
                    var d = normalize(e.source, e.target);
                    set(v, e, iV, iI, d.x, d.y);
                }};}
            );

            if (extensions.OES_standard_derivatives) {
                scene.curveArrows.set(gl, options.styles, textures, curves, function(style)  {return {
                        set: function(v, e, iV, iI)  {return set(v, e, iV, iI, 0.5 * (e.target.x - e.source.x), 0.5 * (e.target.y - e.source.y));}
                    };}
                );

                var dx = Math.cos(0.9);
                var dy = Math.sin(0.9);
                scene.circleArrows.set(gl, options.styles, textures, circles, function(style)  {return {
                        set: function(v, e, iV, iI)  {return set(v, e, iV, iI, e.target.x < 0.5 ? dx : -dx, e.target.y < 0.5 ? -dy : dy);}
                    };}
                );
            }
        }
    }

    this.update = function(element, attribute, data) {
        scene[element].update(gl, attribute, data, function(style)  {return {
            set: function(v, e, iV)  {return ccNetViz.primitive.colors(v, iV, e, e, e, e);}
        };});
    }

    this.draw = function()  {
        var width = canvas.width;
        var height = canvas.height;
        var aspect = width / height;
        var o = view.size === 1 ? offset : 0;
        var ox = o / width;
        var oy = o / height;

        var context = {
            transform: ccNetViz.gl.ortho(view.x - ox, view.x + view.size + ox, view.y - oy, view.y + view.size + oy, -1, 1),
            width: 0.5 * width,
            height: 0.5 * height,
            aspect2: aspect * aspect,
            count: this.nodes.length
        };
        context.curveExc = getSize(context, this.edges.length, 0.5);
        context.style = nodeStyle;
        context.nodeSize = getNodeSize(context);

        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        scene.elements.forEach(function(e)  {return e.draw(context);});
    }.bind(this)

    this.resize = function() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    this.resetView = function() {
        view.size = 1;
        view.x = view.y = 0;
    }

    this.image = function() {
        return canvas.toDataURL();
    }

    this.resize();

    this.nodes = [];
    this.edges = [];

    var view = {};
    this.resetView();

    var gl = getContext();
    var extensions = ccNetViz.gl.initExtensions(gl, "OES_standard_derivatives");
    var textures = new ccNetViz.textures(options.onLoad || this.draw);
    var texts = new ccNetViz.texts(gl, nodeStyle.label.flagSDF, nodeStyle.label.atlasSDF, nodeStyle.label.metricsSDF, atlas);
    var scene = createScene.call(this);


    var getSize = function(c, n, sc)  {
        var result = sc * Math.sqrt(c.width * c.height / n) / view.size;
        var s = c.style;
        if (s) {
            result = s.maxSize ? Math.min(s.maxSize, result) : result;
            result = result < s.hideSize ? 0 : (s.minSize ? Math.max(s.minSize, result) : result);
        }
        return result;
    };
    var getNodeSize = function(c)  {return getSize(c, this.nodes.length, 0.4);}.bind(this);

    var fsLabelsTexture = [
        "precision mediump float;",
        "uniform lowp sampler2D texture;",
        "uniform mediump vec4 color;",
        "uniform mediump float height_font;",
        "float u_buffer = 192.0 / 256.0;",
        "float u_gamma = 4.0 * 1.4142 / height_font;",
        "varying mediump vec2 tc;",
        "void main() {",
        "    float tx=texture2D(texture, tc).r;",
        "    float a= smoothstep(u_buffer - u_gamma, u_buffer + u_gamma, tx);",
        "    gl_FragColor=vec4(color.rgb, a * color.a);",
        "}"
    ];

    var fsColorTexture = [
        "precision mediump float;",
        "uniform vec4 color;",
        "uniform sampler2D texture;",
        "varying vec2 tc;",
        "void main(void) {",
        "  gl_FragColor = color * texture2D(texture, vec2(tc.s, tc.t));",
        "}"
    ];

    var fsVarColorTexture = [
        "precision mediump float;",
        "uniform sampler2D texture;",
        "varying vec2 tc;",
        "varying vec4 c;",
        "void main(void) {",
        "   gl_FragColor = c * texture2D(texture, vec2(tc.s, tc.t));",
        "}"
    ];

    var fsCurve = [
        "#extension GL_OES_standard_derivatives : enable",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "uniform float width;",
        "uniform vec4 color;",
        "varying vec2 c;",
        "void main(void) {",
        "   vec2 px = dFdx(c);",
        "   vec2 py = dFdy(c);",
        "   float fx = 2.0 * c.x * px.x - px.y;",
        "   float fy = 2.0 * c.y * py.x - py.y;",
        "   float sd = (c.x * c.x - c.y) / sqrt(fx * fx + fy * fy);",
        "   float alpha = 1.0 - abs(sd) / width;",
        "   if (alpha < 0.0) discard;",
        "   gl_FragColor = vec4(color.r, color.g, color.b, min(alpha, 1.0));",
        "}"
    ];

    scene.add("lines", new ccNetViz.primitive(gl, edgeStyle, null, [
            "attribute vec2 position;",
            "attribute vec2 normal;",
            "uniform vec2 width;",
            "uniform mat4 transform;",
            "varying vec2 n;",
            "void main(void) {",
            "   gl_Position = vec4(width * normal, 0, 0) + transform * vec4(position, 0, 1);",
            "   n = normal;",
            "}"
        ], [
            "precision mediump float;",
            "uniform vec4 color;",
            "varying vec2 n;",
            "void main(void) {",
            "   gl_FragColor = vec4(color.r, color.g, color.b, color.a - length(n));",
            "}"
        ], function(c)  {
            gl.uniform2f(c.shader.uniforms.width, c.style.width / c.width, c.style.width / c.height);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );

    if (extensions.OES_standard_derivatives) {
        scene.add("curves", new ccNetViz.primitive(gl, edgeStyle, null, [
                "attribute vec2 position;",
                "attribute vec2 normal;",
                "attribute vec2 curve;",
                "uniform float exc;",
                "uniform vec2 screen;",
                "uniform float aspect2;",
                "uniform mat4 transform;",
                "varying vec2 c;",
                "void main(void) {",
                "   vec2 n = vec2(normal.x, aspect2 * normal.y);",
                "   float length = length(screen * n);",
                "   n = length == 0.0 ? vec2(0, 0) : n / length;",
                "   gl_Position = vec4(exc * n, 0, 0) + transform * vec4(position, 0, 1);",
                "   c = curve;",
                "}"
            ], fsCurve, function(c)  {
                gl.uniform1f(c.shader.uniforms.width, c.style.width);
                gl.uniform1f(c.shader.uniforms.exc, c.curveExc);
                gl.uniform2f(c.shader.uniforms.screen, c.width, c.height);
                gl.uniform1f(c.shader.uniforms.aspect2, c.aspect2);
                ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
            })
        );
        scene.add("circles", new ccNetViz.primitive(gl, edgeStyle, null, [
                "attribute vec2 position;",
                "attribute vec2 normal;",
                "attribute vec2 curve;",
                "uniform vec2 size;",
                "uniform mat4 transform;",
                "varying vec2 c;",
                "void main(void) {",
                "   gl_Position = vec4(size * normal, 0, 0) + transform * vec4(position, 0, 1);",
                "   c = curve;",
                "}"
            ], fsCurve, function(c)  {
                gl.uniform1f(c.shader.uniforms.width, c.style.width);
                var size = 2.5 * c.nodeSize;
                gl.uniform2f(c.shader.uniforms.size, size / c.width, size / c.height);
                ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
            })
        );
    }

    if (edgeStyle.arrow) {
        var bind = function(c)  {
            var size = getSize(c, this.edges.length, 0.2);
            if (!size) return true;
            gl.uniform1f(c.shader.uniforms.offset, 0.5 * c.nodeSize);
            gl.uniform2f(c.shader.uniforms.size, size, c.style.aspect * size);
            c.shader.uniforms.exc && gl.uniform1f(c.shader.uniforms.exc, 0.5 * view.size * c.curveExc);
            gl.uniform2f(c.shader.uniforms.screen, c.width, c.height);
            c.shader.uniforms.aspect2 && gl.uniform1f(c.shader.uniforms.aspect2, c.aspect2);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        }.bind(this);
        scene.add("lineArrows", new ccNetViz.primitive(gl, edgeStyle, "arrow", [
                "attribute vec2 position;",
                "attribute vec2 direction;",
                "attribute vec2 textureCoord;",
                "uniform float offset;",
                "uniform vec2 size;",
                "uniform vec2 screen;",
                "uniform float aspect2;",
                "uniform mat4 transform;",
                "varying vec2 tc;",
                "void main(void) {",
                "   vec2 u = direction / length(screen * direction);",
                "   vec2 v = vec2(u.y, -aspect2 * u.x);",
                "   v = v / length(screen * v);",
                "   gl_Position = vec4(size.x * (0.5 - textureCoord.x) * v - size.y * textureCoord.y * u - offset * u, 0, 0) + transform * vec4(position, 0, 1);",
                "   tc = textureCoord;",
                "}"
            ], fsColorTexture, bind)
        );

        if (extensions.OES_standard_derivatives) {
            scene.add("curveArrows", new ccNetViz.primitive(gl, edgeStyle, "arrow", [
                    "attribute vec2 position;",
                    "attribute vec2 direction;",
                    "attribute vec2 textureCoord;",
                    "uniform float offset;",
                    "uniform vec2 size;",
                    "uniform float exc;",
                    "uniform vec2 screen;",
                    "uniform float aspect2;",
                    "uniform mat4 transform;",
                    "varying vec2 tc;",
                    "void main(void) {",
                    "   vec2 u = normalize(vec2(direction.y, -aspect2 * direction.x));",
                    "   u = normalize(direction - exc * u / length(screen * u));",
                    "   u = u / length(screen * u);",
                    "   vec2 v = vec2(u.y, -aspect2 * u.x);",
                    "   v = v / length(screen * v);",
                    "   gl_Position = vec4(size.x * (0.5 - textureCoord.x) * v - size.y * textureCoord.y * u - offset * u, 0, 0) + transform * vec4(position, 0, 1);",
                    "   tc = textureCoord;",
                    "}"
                ], fsColorTexture, bind)
            );
            scene.add("circleArrows", new ccNetViz.primitive(gl, edgeStyle, "arrow", [
                    "attribute vec2 position;",
                    "attribute vec2 direction;",
                    "attribute vec2 textureCoord;",
                    "uniform float offset;",
                    "uniform vec2 size;",
                    "uniform vec2 screen;",
                    "uniform mat4 transform;",
                    "varying vec2 tc;",
                    "void main(void) {",
                    "   vec2 u = direction;",
                    "   vec2 v = vec2(direction.y, -direction.x);",
                    "   gl_Position = vec4((size.x * (0.5 - textureCoord.x) * v - size.y * textureCoord.y * u - offset * u) / screen, 0, 0) + transform * vec4(position, 0, 1);",
                    "   tc = textureCoord;",
                    "}"
                ], fsColorTexture, bind)
            );
        }
    }
    scene.add("nodes", new ccNetViz.primitive(gl, nodeStyle, null, [
            "attribute vec2 position;",
            "attribute vec2 textureCoord;",
            "uniform vec2 size;",
            "uniform mat4 transform;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_Position = vec4(size * (textureCoord - vec2(0.5, 0.5)), 0, 0) + transform * vec4(position, 0, 1);",
            "   tc = textureCoord;",
            "}"
        ], fsColorTexture, function(c)  {
            var size = getNodeSize(c);
            gl.uniform2f(c.shader.uniforms.size, size / c.width, size / c.height);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );
    scene.add("nodesColored", new ccNetViz.primitive(gl, nodeStyle, null, [
            "attribute vec2 position;",
            "attribute vec2 textureCoord;",
            "attribute vec4 color;",
            "uniform vec2 size;",
            "uniform mat4 transform;",
            "varying vec2 tc;",
            "varying vec4 c;",
            "void main(void) {",
            "   gl_Position = vec4(size * (textureCoord - vec2(0.5, 0.5)), 0, 0) + transform * vec4(position, 0, 1);",
            "   tc = textureCoord;",
            "   c = color;",
            "}"
        ], fsVarColorTexture, function(c)  {
            var size = getNodeSize(c);
            gl.uniform2f(c.shader.uniforms.size, size / c.width, size / c.height);
        })
    );
    nodeStyle.label && scene.add("labels", new ccNetViz.primitive(gl, nodeStyle, "label", [
            "attribute vec2 position;",
            "attribute vec2 relative;",
            "attribute vec2 textureCoord;",
            "uniform float offset;",
            "uniform vec2 scale;",
            "uniform mat4 transform;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_Position = vec4(scale * (relative + vec2(0, (2.0 * step(position.y, 0.5) - 1.0) * offset)), 0, 0)",
            "                        + transform * vec4(position, 0,  1);",
            "   tc = textureCoord;",
            "}"
        ], (nodeStyle.label.flagSDF ? fsLabelsTexture : fsColorTexture), function(c)  {
            if (!getNodeSize(c)) return true;
            gl.uniform1f(c.shader.uniforms.offset, 0.5 * c.nodeSize);
            var height_font = +/(\d+)px/.exec(c.style.font)[1] + 1; 
            gl.uniform1f(c.shader.uniforms.height_font, height_font * 2);
            gl.uniform2f(c.shader.uniforms.scale, 1 / c.width, 1 / c.height);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );

    gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    if (options.onLoad) {
        var styles = options.styles;
        for (var p in styles) {
            var s = styles[p];
            s.texture && textures.get(gl, s.texture);
            s.arrow && s.arrow.texture && textures.get(gl, s.arrow.texture);
        }
    }

    canvas.addEventListener("mousedown", onMouseDown.bind(this));
    canvas.addEventListener("wheel", onWheel.bind(this));

    function onWheel(e) {
        var rect = canvas.getBoundingClientRect();
        var size = Math.min(1.0, view.size * (1 + 0.001 * (e.deltaMode ? 33 : 1) * e.deltaY));
        var delta = size - view.size;

        view.size = size;
        view.x = Math.max(0, Math.min(1 - size, view.x - delta * (e.clientX - rect.left) / canvas.width));
        view.y = Math.max(0, Math.min(1 - size, view.y - delta * (1 - (e.clientY - rect.top) / canvas.height)));

        this.draw();
	    e.preventDefault();
    }

    function onMouseDown(e) {
        var width = canvas.width / view.size;
        var height = canvas.height / view.size;
        var dx = view.x + e.clientX / width;
        var dy = e.clientY / height - view.y;

        var drag = function(e)  {
            view.x = Math.max(0, Math.min(1 - view.size, dx - e.clientX / width));
            view.y = Math.max(0, Math.min(1 - view.size, e.clientY / height - dy));
            this.draw();
            e.preventDefault();
        }.bind(this);

        var up = function()  {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('mousemove', drag);
        };
        window.addEventListener('mouseup', up);
        window.addEventListener('mousemove', drag);
    }

    function getContext() {
        var attributes = { depth: false, antialias: false };
        return canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
    }

    function createScene() {
        return {
            elements: [],
            add: function(name, e)  {
                scene[name] = e;
                scene.elements.push(e);
            }
        };
    }
}

ccNetViz.utils = function() {};

ccNetViz.utils.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
        var last = Date.now - timestamp;

        if (last < wait && last > 0) {
            timeout = setTimeout(later, wait - last);
        } else {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            }
        }
    };

    return function() {
        context = this;
        args = arguments;
        timestamp = Date.now;
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }

        return result;
    };
};

ccNetViz.color = function (color) {
    this.a = 1;

    if (arguments.length >= 3) {
        this.r = arguments[0];
        this.g = arguments[1];
        this.b = arguments[2];
        arguments.length > 3 && (this.a = arguments[3]);
    }
    else if (/^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.test(color)) {
        color = /^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.exec(color);
        var get = function(v)  {return parseInt(v, 10) / 255;};

        this.r = get(color[1]);
        this.g = get(color[2]);
        this.b = get(color[3]);
    }
    else if (/^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.test(color)) {
        color = /^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.exec(color);
        var get = function(v)  {return parseInt(v, 10) / 100;};

        this.r = get(color[1]);
        this.g = get(color[2]);
        this.b = get(color[3]);
    }
    else if (/^\#([0-9a-f]{6})$/i.test(color)) {
        color = parseInt(color.substring(1), 16);
        this.r = (color >> 16 & 255) / 255;
        this.g = (color >> 8 & 255) / 255;
        this.b = (color & 255) / 255;
    }
    else {
        this.r = this.g = this.b = 0;
    }
};

ccNetViz.gl = function() {}

ccNetViz.gl.initExtensions = function(gl) {
    var extensions = gl.getSupportedExtensions();
    var result = {};
    for (var i = 1; i < arguments.length; i++) {
        var e = arguments[i];
        (result[e] = extensions.indexOf(e) >= 0) && gl.getExtension(e);
    }
    return result;
}

ccNetViz.gl.createShader = function(gl, type, source) {
    var result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);

    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(result));
        return null;
    }
    return result;
}

ccNetViz.gl.createTexture = function(gl, img, onLoad) {
    var result = gl.createTexture();

    function load() {
        image.onload = null;
        gl.bindTexture(gl.TEXTURE_2D, result);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
        onLoad && onLoad();
    }

    var image = new Image();
    image.onload = load;
    image.src = img;
    image.naturalWidth && image.naturalHeight && load();
    return result;
}

ccNetViz.gl.uniformColor = function(gl, location, color) {
    gl.uniform4f(location, color.r, color.g, color.b, color.a);
}

ccNetViz.gl.ortho = function(left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);

    var result = new Float32Array(16);
    result[0] = -2 * lr;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = -2 * bt;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = 2 * nf;
    result[11] = 0;
    result[12] = (left + right) * lr;
    result[13] = (top + bottom) * bt;
    result[14] = (far + near) * nf;
    result[15] = 1;
    return result;
}

ccNetViz.shader = function(gl, vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, ccNetViz.gl.createShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(program, ccNetViz.gl.createShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);

    this.uniforms = {};
    var n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
        var name = gl.getActiveUniform(program, i).name;
        this.uniforms[name] = gl.getUniformLocation(program, name);
    }

    this.attributes = {};
    n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < n; i++) {
        var name = gl.getActiveAttrib(program, i).name;
        this.attributes[name] = { index: i, size: ccNetViz.shader.attribute[name] || 2 };
    }

    this.bind = function()  {
        gl.useProgram(program);
        for (var i = 0; i < n; i++) gl.enableVertexAttribArray(i);
    };

    this.unbind = function()  {
        for (var i = 0; i < n; i++) gl.disableVertexAttribArray(i);
    };
}

ccNetViz.shader.attribute = {
    color: 4
}

ccNetViz.primitive = function(gl, baseStyle, styleProperty, vs, fs, bind) {
    var shader = new ccNetViz.shader(gl, vs.join('\n'), fs.join('\n'));
    var buffers = [];
    var sections = [];

    this.set = function(gl, styles, textures, data, get)  {
        var parts = {};

        for (var i = 0; i < data.length; i++) {
            var e = data[i];
            var part = parts[e.style] = parts[e.style] || [];
            part.push(e);
        }

        var iV, iI, iS = 0, iB = 0;
        var e = {};

        var init = function(filler, n)  {
            iV = iI = 0;
            var max = Math.floor(ccNetViz.primitive.maxBufferSize / filler.numVertices);
            var nV = Math.min(max, n - (iB - iS)*max);
            var nI = nV * filler.numIndices;

            if (!e.indices || e.indices.length !== nI) {
                e.indices = new Uint16Array(nI);
                nV *= filler.numVertices;
                for (var a in shader.attributes) e[a] = new Float32Array(shader.attributes[a].size * nV);
            } 
        };

        var store = function(section)  {
            var b = buffers[iB];
            if (!b) {
                buffers[iB] = b = {};
                for (var a in e) b[a] = gl.createBuffer();
            }
            for (var a in shader.attributes) {
                gl.bindBuffer(gl.ARRAY_BUFFER, b[a]);
                gl.bufferData(gl.ARRAY_BUFFER, e[a], gl.STATIC_DRAW);
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.indices);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, e.indices, gl.STATIC_DRAW);
            
            b.numIndices = iI;
            b.numVertices = iV;
            section.buffers.push(b);
            iB++;
        };

        var createStyle = function(style)  {
            var result = {};
            var copy = function(s)  {
                if (s) for (var p in s) result[p] = s[p];
            };

            copy(baseStyle);
            copy(style);

            if (styleProperty) {
                copy(baseStyle[styleProperty]);
                style && copy(style[styleProperty]);
            }
            result.color = result.color && new ccNetViz.color(result.color);
            return result;
        };

        sections = [];
        for (var p in parts) {
            iS = iB;

            var section = {
                style: createStyle(styles[p]),
                buffers: []
            };

            var filler = get(section.style);
            filler.numVertices = filler.numVertices || 4;
            filler.numIndices = filler.numIndices || 6;

            var part = parts[p];

            /*
             Increase the buffer for writing text letter by letter (znbiz)
             */
            var k = 0; 
            if(baseStyle.label) {
                if(baseStyle.label.flagSDF) {
                    for(var i = 0; i < part.length; i++) {
                        if(part[i].label) {
                            k +=  part[i].label.length;
                        }
                    }
                }
            }
            
            init(filler, part.length + k);
            var max = ccNetViz.primitive.maxBufferSize - filler.numVertices;
            for (var i = 0; i < part.length; i++, iV += filler.numVertices, iI += filler.numIndices) {
                if (iV > max) { 
                    store(section);
                    init(filler, part.length + k);
                }

                /*
                 Process the names of units and ourselves nodes (znbiz)
                 */
                if(part[i].label) {
                    var iViI = [iV, iI];
                    filler.set(e, part[i], iViI);
                    iV = iViI[0];
                    iI = iViI[1];
                } else {
                    filler.set(e, part[i], iV, iI);
                }
            }
            store(section);

            function add() { 
                sections.push(this);
            }
            var addSection = add.bind(section);

            typeof section.style.texture === 'string' ? section.style.texture = textures.get(gl, section.style.texture, addSection) : addSection();
        }
    }.bind(this)

    var fb;
    this.update = function(gl, attribute, data, get)  {
        var i = 0, size = shader.attributes[attribute].size;
        sections.forEach(function(section)  {
            var filler = get(section.style);
            filler.numVertices = filler.numVertices || 4;

            section.buffers.forEach(function(e)  {
                (!fb || fb.length !== size * e.numVertices) && (fb = new Float32Array(size * e.numVertices));
                for (var iV = 0; iV < e.numVertices; iV += filler.numVertices) filler.set(fb, data[i++], iV);
                gl.bindBuffer(gl.ARRAY_BUFFER, e[attribute]);
                gl.bufferData(gl.ARRAY_BUFFER, fb, gl.DYNAMIC_DRAW);
            });
        });
    }

    this.draw = function(context)  {
        context.shader = shader;
        shader.bind();

        gl.uniformMatrix4fv(shader.uniforms.transform, false, context.transform);

        sections.forEach(function(section)  { 
            if (section.style.texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, section.style.texture);
                gl.uniform1i(shader.uniforms.texture, 0);
            }

            context.style = section.style;
            if (bind(context)) return;

            section.buffers.forEach(function(e)  {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, e.indices);

                for (var a in shader.attributes) {
                    var attribute = shader.attributes[a];
                    gl.bindBuffer(gl.ARRAY_BUFFER, e[a]);
                    gl.vertexAttribPointer(attribute.index, attribute.size, gl.FLOAT, false, 0, 0);
                }
                gl.drawElements(gl.TRIANGLES, e.numIndices, gl.UNSIGNED_SHORT, 0);
            });
        });

        shader.unbind();
    }
}

ccNetViz.primitive.vertices = function(buffer, iV) {
    for (var i = 2, j = 2 * iV, n = arguments.length; i < n; i++, j++) buffer[j] = arguments[i];
}

ccNetViz.primitive.colors = function(buffer, iV) {
    for (var i = 2, j = 4 * iV, n = arguments.length; i < n; i++) {
        var c = arguments[i];
        buffer[j++] = c.r;
        buffer[j++] = c.g;
        buffer[j++] = c.b;
        buffer[j++] = c.a;
    }
}

ccNetViz.primitive.indices = function(buffer, iV, iI) {
    for (var i = 3, j = iI, n = arguments.length; i < n; i++, j++) buffer[j] = iV + arguments[i];
}

ccNetViz.primitive.quad = function(buffer, iV, iI) {
    ccNetViz.primitive.indices(buffer, iV, iI, 0, 1, 2, 2, 3, 0);
}

ccNetViz.primitive.maxBufferSize = 65536;

ccNetViz.textures = function(onLoad) {
    var load = ccNetViz.utils.debounce(onLoad, 5);
    var textures = {};
    var pending = {};
    var n = 0;

    this.get = function(gl, img, action) { 
        var p = pending[img];
        var t = textures[img];

        if (p) {
            p.push(action);
        }
        else if (t) {
            action && action();
        }
        else {
            p = pending[img] = [action];
            n++;
            textures[img] = t = ccNetViz.gl.createTexture(gl, img, function()  {
                p.forEach(function(a)  {return a && a();});
                delete pending[img];
                --n || load();
            });
        }
        return t;
    }
}

ccNetViz.texts = function(gl, flagSDF, atlasSDF, metricsSDF, atlas) {

    if (flagSDF) { 
        /*
         Draw a text character by character. Each character has its own texture
         */
        var size;

        var canvas = document.createElement("canvas");

        var rendered, texts;
        var x, y, height_font, scale;
        var buffer;

        var metrics, result;

        this.texture = gl.createTexture();

        this.clear = function()  {
            rendered = {};
            height_font = x = y = 0;
        };

        this.setFont = function(style)  {
            var font = style.font;
            rendered[font] = texts = rendered[font] || {};
            x = 0;
            y += height_font;
            height_font = (+/(\d+)px/.exec(font)[1] + 1) / 2;

            var font_family = /\s(\D\S\w+),/.exec(font)[1];

            if(!(atlasSDF && metricsSDF)) {
                /*
                 We prepare for the atlas coordinates, which generate in our library ccNetViz
                 */
                if(!atlas.atlas || (!(font_family == atlas.options.font_family)) && font_family) {
                    atlas.options = {
                            size: 50,
                            font_family: font_family || "Arial",
                            start: 1,
                            end: 256
                        }
                    atlas.atlas =  ccNetViz.texts.generateSDFatlas(atlas.options); 
                }
                canvas = atlas.atlas.img;
                metrics = atlas.atlas.metrics;
            } else {
                /*
                 We prepare the coordinates for the atlas, which is created on the server
                 */
                canvas = atlasSDF;
                metrics = metricsSDF;
                buffer = metrics.buffer;
            }
            canvas.style.width = canvas.style.height_font = canvas.width + 'px';
            canvas.style.display = "none";
            document.body.appendChild(canvas);
            size = canvas.width;
            scale = 1;
        };

        this.get = function(text)  {
            var result = texts[text];
            if (!result) {
                var char = metrics.chars[text];
                if(!(atlasSDF && metricsSDF)) {
                    texts[text] = result = {
                        width: (char[4] - char[4] / 3) / 25 * height_font,
                        height: char[1] / 25 * height_font,
                        left: (char[5] + char[2] + char[4] / 6) / size,
                        right: (char[5] + char[2] + char[4] - char[4] / 6) / size,
                        top: char[6] / size,
                        bottom: (char[6] + char[1]) / size
                    };
                } else {
                    var width = char[0] + buffer * 2;
                    var height = char[1] + buffer * 2;
                    var horiBearingX = char[2];
                    var horiBearingY = char[3];
                    var horiAdvance = char[4];
                    var posX = char[5];
                    var posY = char[6];
                    texts[text] = result = {
                        horiAdvance: horiAdvance,
                        horiBearingX: horiBearingX,
                        horiBearingY: horiBearingY,
                        width: width,
                        height: height,
                        left: (posX) / canvas.width,
                        right: (posX + width) / canvas.width,
                        top: (posY) / canvas.height,
                        bottom: (posY+height) / canvas.height
                    };
                };
            } 
            return result;
        };

        this.bind = function()  { 
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, canvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        }.bind(this);
    } else {
        /*
         Draw text on one texture
         */
        var size = 1024

        var canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        canvas.style.width = canvas.style.height = size + 'px';
        canvas.style.display = "none";
        document.body.appendChild(canvas);

        var context = canvas.getContext('2d');
        context.fillStyle = "white";
        context.textAlign = "left";
        context.textBaseline = "top";

        var rendered, texts;
        var x, y, height;

        this.texture = gl.createTexture();

        this.clear = function()  {
            rendered = {};
            context.clearRect(0, 0, size, size);
            height = x = y = 0;
        };
        this.setFont = function(style)  {
            var font = style.font;
            rendered[font] = texts = rendered[font] || {};
            context.font = font;
            x = 0;
            y += height;
            height = +/(\d+)px/.exec(font)[1] + 1;
        };

        this.get = function(text)  {
            var result = texts[text];
            if (!result) {
                var width = context.measureText(text).width;
                if (x + width > size) {
                    x = 0;
                    y += height;
                }
                
                context.fillText(text, x, y);
                texts[text] = result = {
                    width: width,
                    height: height,
                    left: x / size,
                    right: (x + width) / size,
                    top: y / size,
                    bottom: (y + height) / size
                };
                x += width;
            }
            return result;
        };

        this.bind = function()  { 
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }.bind(this);
    }
}



ccNetViz.quadtree = function(points) {
    var d, xs, ys, i, n, x1_, y1_, x2_, y2_;

    x2_ = y2_ = -(x1_ = y1_ = Infinity);
    xs = [], ys = [];
    n = points.length;

    for (i = 0; i < n; ++i) {
        d = points[i];
        if (d.x < x1_) x1_ = d.x;
        if (d.y < y1_) y1_ = d.y;
        if (d.x > x2_) x2_ = d.x;
        if (d.y > y2_) y2_ = d.y;
        xs.push(d.x);
        ys.push(d.y);
    }

    var dx = x2_ - x1_;
    var dy = y2_ - y1_;
    dx > dy ? y2_ = y1_ + dx : x2_ = x1_ + dy;

    function create() {
        return {
            leaf: true,
            nodes: [],
            point: null,
            x: null,
            y: null
        };
    }

    function visit(f, node, x1, y1, x2, y2) {
        if (!f(node, x1, y1, x2, y2)) {
            var sx = (x1 + x2) * 0.5;
            var sy = (y1 + y2) * 0.5;
            var children = node.nodes;

            if (children[0]) visit(f, children[0], x1, y1, sx, sy);
            if (children[1]) visit(f, children[1], sx, y1, x2, sy);
            if (children[2]) visit(f, children[2], x1, sy, sx, y2);
            if (children[3]) visit(f, children[3], sx, sy, x2, y2);
        }
    }

    function insert(n, d, x, y, x1, y1, x2, y2) {
        if (n.leaf) {
            var nx = n.x;
            var ny = n.y;

            if (nx !== null) {
                if (nx === x && ny === y) {
                    insertChild(n, d, x, y, x1, y1, x2, y2);
                }
                else {
                    var nPoint = n.point;
                    n.x = n.y = n.point = null;
                    insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
                    insertChild(n, d, x, y, x1, y1, x2, y2);
                }
            } else {
                n.x = x, n.y = y, n.point = d;
            }
        } else {
            insertChild(n, d, x, y, x1, y1, x2, y2);
        }
    }

    function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var xm = (x1 + x2) * 0.5;
        var ym = (y1 + y2) * 0.5;
        var right = x >= xm;
        var below = y >= ym;
        var i = below << 1 | right;

        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = create());

        right ? x1 = xm : x2 = xm;
        below ? y1 = ym : y2 = ym;
        insert(n, d, x, y, x1, y1, x2, y2);
    }

    function findNode(root, x, y, x0, y0, x3, y3) {
        var minDistance2 = Infinity;
        var closestPoint;

        (function find(node, x1, y1, x2, y2) {
            if (x1 > x3 || y1 > y3 || x2 < x0 || y2 < y0) return;

            if (point = node.point) {
                var point;
                var dx = x - node.x;
                var dy = y - node.y;
                var distance2 = dx * dx + dy * dy;

                if (distance2 < minDistance2) {
                    var distance = Math.sqrt(minDistance2 = distance2);
                    x0 = x - distance, y0 = y - distance;
                    x3 = x + distance, y3 = y + distance;
                    closestPoint = point;
                }
            }

            var children = node.nodes;
            var xm = (x1 + x2) * .5;
            var ym = (y1 + y2) * .5;
            var right = x >= xm;
            var below = y >= ym;

            for (var i = below << 1 | right, j = i + 4; i < j; ++i) {
                if (node = children[i & 3]) switch (i & 3) {
                    case 0: find(node, x1, y1, xm, ym); break;
                    case 1: find(node, xm, y1, x2, ym); break;
                    case 2: find(node, x1, ym, xm, y2); break;
                    case 3: find(node, xm, ym, x2, y2); break;
                }
            }
        })(root, x0, y0, x3, y3);

        return closestPoint;
    }

    var root = create();
    root.visit = function(f)  {return visit(f, root, x1_, y1_, x2_, y2_);};
    root.find = function(x, y)  {return findNode(root, x, y, x1_, y1_, x2_, y2_);};

    for (i = 0; i < n; i++) insert(root, points[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
    --i;

    xs = ys = points = d = null;

    return root;
};

ccNetViz.layout = function() {}

ccNetViz.layout.normalize = function(nodes) {
    var n = nodes.length;
    var maxX = -Infinity;
    var maxY = -Infinity;
    var minX = Infinity;
    var minY = Infinity;

    for (var i = 0; i < n; i++) {
        var o = nodes[i];
        maxX = Math.max(maxX, o.x);
        maxY = Math.max(maxY, o.y);
        minX = Math.min(minX, o.x);
        minY = Math.min(minY, o.y);
    };

    var scX = minX !== maxX ? 1 / (maxX - minX) : ((minX -= 0.5), 1);
    var scY = minY !== maxY ? 1 / (maxY - minY) : ((minY -= 0.5), 1);

    for (var i = 0; i < n; i++) {
        var o = nodes[i];
        o.x = scX * (o.x - minX);
        o.y = scY * (o.y - minY);
    }
}

ccNetViz.layout.random = function(nodes) {
    this.apply = function() {
        for (var i = 0, n = nodes.length; i < n; i++) {
            var o = nodes[i];
            o.x = Math.random();
            o.y = Math.random();
        }
    }
}

ccNetViz.layout.force = function(nodes, edges) {
    var size = [1, 1],
        alpha,
        friction = 0.9,
        edgeDistance = 15,
        edgeStrength = 1,
        charge = -30,
        chargeDistance2 = Infinity,
        gravity = 0.4,
        theta2 = .64,
        distances = [],
        strengths = [],
        charges = [];

    function accumulate(quad, alpha, charges) {
        var cx = 0, cy = 0;
        quad.charge = 0;
        if (!quad.leaf) {
            var nodes = quad.nodes;
            var c, n = nodes.length;

            for (var i = 0; i < n; i++) {
                c = nodes[i];
                if (c == null) continue;
                accumulate(c, alpha, charges);
                quad.charge += c.charge;
                cx += c.charge * c.cx;
                cy += c.charge * c.cy;
            }
        }
        if (quad.point) {
            if (!quad.leaf) {
                quad.point.x += Math.random() - 0.5;
                quad.point.y += Math.random() - 0.5;
            }
            var k = alpha * charges[quad.point.index];
            quad.charge += quad.pointCharge = k;
            cx += k * quad.point.x;
            cy += k * quad.point.y;
        }
        quad.cx = cx / quad.charge;
        quad.cy = cy / quad.charge;
    }

    function repulse(node) {
        return function(quad, x1, _, x2) {
            if (quad.point !== node) {
                var dx = quad.cx - node.x;
                var dy = quad.cy - node.y;
                var dw = x2 - x1;
                var dn = dx * dx + dy * dy;

                if (dw * dw / theta2 < dn) {
                    if (dn < chargeDistance2) {
                        var k = quad.charge / dn;
                        node.px -= dx * k;
                        node.py -= dy * k;
                    }
                    return true;
                }

                if (quad.point && dn && dn < chargeDistance2) {
                    var k = quad.pointCharge / dn;
                    node.px -= dx * k;
                    node.py -= dy * k;
                }
            }
            return !quad.charge;
        };
    }

    function step() {
        if ((alpha *= .99) < .05) {
            alpha = 0;
            return true;
        }

        var q, o, s, t, l, k, x, y;
        var n = nodes.length;
        var m = edges.length;

        for (var i = 0; i < m; i++) {
            o = edges[i];
            s = o.source;
            t = o.target;
            x = t.x - s.x;
            y = t.y - s.y;
            if (l = (x * x + y * y)) {
                l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
                x *= l;
                y *= l;
                t.x -= x * (k = s.weight / (t.weight + s.weight));
                t.y -= y * k;
                s.x += x * (k = 1 - k);
                s.y += y * k;
            }
        }

        if (k = alpha * gravity) {
            x = size[0] / 2;
            y = size[1] / 2;

            for (var i = 0; i < n; i++) {
                o = nodes[i];
                o.x += (x - o.x) * k;
                o.y += (y - o.y) * k;
            }
        }

        if (charge) {
            accumulate(q = ccNetViz.quadtree(nodes), alpha, charges);

            for (var i = 0; i < n; i++) {
                var o = nodes[i];
                !o.fixed && q.visit(repulse(o));
            }
        }

        for (var i = 0; i < n; i++) {
            o = nodes[i];
            if (o.fixed) {
                o.x = o.px;
                o.y = o.py;
            }
            else {
                o.x -= (o.px - (o.px = o.x)) * friction;
                o.y -= (o.py - (o.py = o.y)) * friction;
            }
        }
    };

    this.apply = function() {
        var n = nodes.length;
        var d = Math.sqrt(n);
        var s = 0.3 / d;

        for (var i = 0; i < n; i++) {
            var o = nodes[i];
            o.weight = 0;
            o.x = o.x !== undefined ? o.x : s + (i % d) / d;
            o.y = o.y !== undefined ? o.y : s + Math.floor(i / d) / d;
            o.px = o.x;
            o.py = o.y;
            charges[i] = charge;
        }

        for (var i = 0; i < edges.length; i++) {
            var o = edges[i];
            o.source.weight++;
            o.target.weight++;
            distances[i] = edgeDistance;
            strengths[i] = edgeStrength;
        }

        alpha = 0.1;
        while (!step());

        return true;
    };
};

/**
 *  Author: Alexei Nekrasov (znbiz, E-mail: nekrasov.aleks1992@gmail.com)
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

        var size = Math.floor(1.5 * Math.sqrt(nodes.length))
        
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
            delta = temp_array[0];
            
            
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



    var size_temp;
    this.apply = function() { 
        
        ///////////////////////////////////////////////////////////////////////////////////////////////
        /// main
        ///////////////////////////////////////////////////////////////////////////////////////////////
        size_temp = Math.floor(1.5 * Math.sqrt(nodes.length));

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

/**
 *  Author: Alexei Nekrasov (znbiz, E-mail: nekrasov.aleks1992@gmail.com)
 *  Font Generator atlas using SDF filter. The use of the SDF filter occurs on the GPU
 *
 * options = {
 *          size: 50,
 *          font_family: "Arial",
 *          start: 1,
 *          end: 256
 *      }
 */
ccNetViz.texts.generateSDFatlas = function(options){
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
            "        min = 1.0;",
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
            "        float min_temp = pow(min, 0.8);",
            "        min = pow(min, step / min_temp );",
            "        float st = 1.0 - pow(step, 0.46) * 3.5;",
            "        min = (st + min);",
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
            "        min = pow(min, 0.23);",
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
            var names = ["experimental-webgl", "webkit-3d", "moz-webgl"];
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
        var delta = 8;
        var family = family_option;
        var metrics = {
                family : family,
                style  : "Regular",
                size   : size_font,
                chars  : {}
        };
        var size_font = size_font_option;
        var delta_1 = size_font + 14;
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
        // var delta = Math.floor(Math.sqrt(number_char_portions)+1);
        // var delta_1 = size + Math.floor(size / 8);
        var delta = 8;
        var delta_1 = size + 14;
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