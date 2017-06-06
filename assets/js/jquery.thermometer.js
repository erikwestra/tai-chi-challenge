/* jquery.thermometer.js
 *
 * This module implements a "thermometer" control.  It is based on the
 * jquery.tempgauge module, but was rewritten to provide a better visual
 * effect.
 *
 * Written by Erik Westra <ewestra@gmail.com>.
 */

(function($){

  // The following constants define the various parts of the thermometer
  // control:

  WIDTH = 100 // pixels.
  HEIGHT = 200 // pixels.

  // ========================================================================
  // 
  // $.fn.thermometer(options)
  //
  //     Create a new thermometer for each of the selected DOM elements.  The
  //     thermometer will have the given options.
  //     
  //     `options` should be an object with the following properties:
  //
  //         'value'
  //
  //             The current value of the thermometer.
  //
  //         'max'
  //
  //             The maximum value of the thermometer.

  $.fn.thermometer = function (options) {

    var thermometers = []
    this.each(function(index, element) {
      thermometers.push($.fn.thermometer.create(element, options))
    })

    return thermometers
  }

  // ========================================================================
  //
  // $.fn.thermometer.create(element, options)
  //
  //    Create a new thermometer based on the given options.
  //     
  //     `element` should be the DOM object to replace with the map canvas, and
  //     `options` should be an object with the following properties:
  //
  //         'value'
  //
  //             The current value of the thermometer.
  //
  //         'max'
  //
  //             The maximum value of the thermometer.
  //
  //     We create and return a new canvas object representing this
  //     thermometer.

  $.fn.thermometer.create = function (element, options) {

    var canvas = document.createElement('canvas')
    var context = canvas.getContext('2d')
    var value = options.value
    var max = options.max

    canvas.width = WIDTH
    canvas.height = HEIGHT

    $(element).replaceWith(canvas)

    var fraction;
    if (options.value == 0) {
      fraction = 0.0
    } else {
      fraction = options.value / options.max // 0..1
      if (fraction < 0.0) {
        fraction = 0.0
      } else if (fraction > 1.0) {
        fraction = 1.0
      }
    }

    context.lineWidth = 1
    context.strokeStyle = 'black'
    context.fillStyle = '#49abff'

    context.save()
    $.fn.thermometer.definePath(context)
    context.clip()

    context.fillRect(0, Math.floor((1.0-fraction) * 200), 100, 200)
    context.restore()

    context.save()
    $.fn.thermometer.definePath(context)
    context.stroke()
    context.restore()

    return canvas
  }

  // ========================================================================
  //
  // $.fn.thermometer.definePath(context)
  //
  //     Define a path within the given rendering context that forms the
  //     outline of the thermometer.
  //
  //     The given graphics context will have its current path set to the
  //     outline of the thermometer.

  $.fn.thermometer.definePath = function (context) {

      var x = 0
      var y = 5

      var width = WIDTH
      var height = HEIGHT - 10

      var wholeCircle = Math.PI * 2
      var smallRadius = width / 3 / 2
      var xSmall = x + width / 2
      var ySmall = y + smallRadius

      var bigRadius = height / 6
      var xBig = x + width / 2
      var yBig = y + height / 6 * 5

      var offSet = Math.sqrt((Math.pow(bigRadius, 2) -
                              Math.pow(smallRadius / 2, 2)), 2)
      var twoThirdsLength = height / 6 * 5 - offSet - width / 3 / 2

      var topLength = twoThirdsLength

      var yBox = yBig - offSet - topLength
      var xBox = xBig - width / 6
      var sRad = Math.asin(smallRadius / bigRadius)

      context.beginPath()
      context.arc(xSmall, yBox, smallRadius, 0, wholeCircle * -0.5, true)
      context.arc(xBig, yBig, bigRadius, wholeCircle * 0.75 - sRad,
                  wholeCircle * -0.25 + sRad, true)
      context.closePath()
    }

})(jQuery);
