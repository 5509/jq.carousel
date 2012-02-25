/**
 * jq.carousele
 *
 * @version      0.3
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/jq.carousel
 *
 * 2012-02-25 21:16
 */
;(function($, undefined) {

  var Carousel = function(parent, conf) {
    this.namespace = 'Carousel';
    if ( this instanceof Carousel ) {
      return this.init(parent, conf);
    }
    return new Carousel(parent, conf);
  };
  Carousel.prototype = {

    init: function(parent, conf) {
      var self = this,
        cloned = undefined;

      self.conf = $.extend({
        type    : 'horizontal', // or vertical
        easing  : 'swing',      // or custom easing
        move    : 1,
        duration: 0.2           // int or float, 0.2 => 0.2s
      }, conf);

      self.$elem = parent;
      self.$carousel_wrap = $('<div></div>');

      self.view_width = parent[0].offsetWidth;
      self.total_width = 0;
      self.current_item = 0;

      self.$items = parent.find('.carousel_box');
      self.items_length = self.$items.length;
      self.items_len_hidden = 0;
      

      self.$elem.append(
        self.$carousel_wrap
          .append(
            self.$items
          )
      );

      // setup
      each(self.$items, function(i) {
        var item = this;

        item.carousel_id = i;
        item.$elem = $(this);
        item.data_width = item.offsetWidth;
        item.origWidth = item.$elem.css('width');
        item.$elem.css({
          float: 'left'
        });

        if ( self.items_len_hidden > self.view_width ) return;
        self.items_len_hidden = self.items_len_hidden + item.data_width;
      });
      self.item_width = self.$items.eq(0)[0].data_width;
      self.items_len_hidden = self.items_len_hidden / self.item_width;

      // clone nodes
      self._cloneItem();

      self.$elem.css({
        overflow: 'hidden',
        position: 'relative'
      });

      // carousel width and height
      self.current_pos = -self.items_len_hidden * self.item_width;
      self.default_pos = self.current_pos;
      self.$carousel_wrap.css({
        //width: self.total_width,
        //self.$items.eq(0)[0].data_width
        position: 'absolute',
        left: self.current_pos + 'px',
        height: self.$items.eq(0)[0].offsetHeight
      });

      // max and min point
      self.max_point = self.default_pos - (self.item_width * self.items_length);
      self.min_point = self.default_pos;

      // move size
      self.move_size = self.item_width * self.conf.move;

      self.$items = self.$carousel_wrap.find('.carousel_box');
      self._setWidth();
      self.$elem.trigger('carousel.ready');

      return self;
    },

    _eventify: function() {
      var self = this;

    },

    // returns first and last items
    _cloneItem: function() {
      var self = this,
          // 追加するlengthは表示幅よりもひとつ超えるサイズにする
          len = self.items_len_hidden,
          flexnth = function(state, n) { // state: n<3, 3<n
            var i, $elems = this, nth = [];
            for ( i = 0; i < n; i++ ) {
              if ( i === n ) break;
              nth.push(
                $elems.eq(
                  state !== '<' ? $elems.length-(1+i) : i
                ).clone()
              );
            }
            return $(nth);
          },
          reverse = function() {
            var elems = [];
            $.each(this, function(i, $item) {
              elems.unshift($item.clone());
            });
            return $(elems);
          },
          $first = reverse.call(flexnth.call(self.$items, '<', len)),
          $last = reverse.call(flexnth.call(self.$items, '>', len));

        each($first, function() {
          self.$items.eq(self.$items.length-1).after(this);
        });
        each($last, function() {
          self.$items.eq(0).before(this);
        });
    },

    _setPosition: function() {
      var self = this;
    },

    // refresh totalWitdh
    _getWidth: function(index) {
      var self = this,
        $items = self.$elem.find('.carousel_box');

      self.total_width = 0;
      each($items, function(i) {
        var item = this;

        item.data_width = item.offsetWidth;
        // set total_width
        self.total_width = self.total_width + item.data_width;
      });
    },

    _setWidth: function() {
      var self = this;
      self._getWidth();
      self.$carousel_wrap.css({
        width: self.total_width
      });
    },

    _getNext: function(i) {
      var self = this;
      if ( i > 0 ) {
        if ( i + 1 >= self.item_length - 1 ) {
          i = 0;
        } else {
          i = i + 1;
        }
      } else {
        if ( i + 1 <= 0 ) {
          i = self.item_length - 1;
        } else {
          i = i + 1;
        }
      }
      return i;
    },

    _toNext: function() {
      var self = this,
          conf = self.conf,
          hidden_len = self.items_len_hidden,
          next = self._getNext(1),
          prop = {};

      self.current_pos = self.current_pos - self.move_size;
      if ( self.current_pos < self.max_point ) {
        self.$carousel_wrap.css('left', self.default_pos);
        self.current_pos = self.default_pos - self.move_size;
      }

      prop.left = self.current_pos;

      self.$carousel_wrap
      .animate(prop, {
        queue: false,
        easing: conf.easing,
        duration: conf.duration*1000
      });
    },

    _toPrev: function() {
      var self = this,
          conf = self.conf,
          hidden_len = self.items_len_hidden,
          total_length = self.items_length + hidden_len,
          items_width = self.item_width * self.items_length,
          next = self._getNext(-1),
          prop = {};

      self.current_pos = self.current_pos + self.move_size;
      if ( self.default_pos < self.current_pos ) {
        self.$carousel_wrap.css('left', -self.item_width * total_length);
        self.current_pos = self.default_pos - items_width + self.move_size;
      }

      prop.left = self.current_pos;

      self.$carousel_wrap
      .animate(prop, {
        queue: false,
        easing: conf.easing,
        duration: conf.duration*1000
      });
    },

    _hold: function() {
    },

    prev: function() {
      var self = this;
      self._toPrev();
    },

    next: function() {
      var self = this;
      self._toNext();
    },

    go: function(n) {
    }

  };

  function extend_method(base, obj) {
    var c = undefined,
      namespace = to_first_letter_lower_case(obj.namespace),
      method_name = undefined;
    for ( c in obj ) {
      if ( typeof obj[c] !== 'function'
        || /(?:^_)|(?:^handleEvent$)|(?:^init$)/.test(c) ) {
        continue;
      }
      method_name = namespace + to_first_letter_upper_case(c);
      base[method_name] = (function() {
        var p = c;
        return function(arguments) {
          return obj[p](arguments);
        }
      }());
    }
  }

  function to_first_letter_upper_case(string) {
    return string.replace(
      /(^[a-z])/,
      function($1) {
        return $1.toUpperCase();
      }
    );
  }

  function to_first_letter_lower_case(string) {
    return string.replace(
      /(^[A-Z])/,
      function($1) {
        return $1.toLowerCase();
      }
    );
  }

  function each(arr, func) {
    var i = 0,
        l = undefined;

    // arr === number
    if ( /^\d+$/.test(arr) ) {
      arr = new Array(arr);
    }
    l = arr.length;

    for ( ; i < l; i = i + 1 ) {
      func.apply(arr[i], ([i]).concat(arguments));
    }
  }

  // method extend
  jQuery.carousel = Carousel;
  // $.fn extend
  jQuery.fn.carousel = function(conf) {
    var type = Carousel(this, conf);

    extend_method(this, type);
    return this;
  };

}(jQuery));
