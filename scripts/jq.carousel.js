/**
 * jq.carousele
 * Simple and customizable carousel
 *
 * @version      0.62
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/jq.carousel
 *
 * 2012-02-26 03:40
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
      var self = this;

      self.conf = $.extend({
        easing  : 'swing',      // or custom easing
        start   : 1,            // int
        group   : 1,            // int
        duration: 0.2           // int or float, 0.2 => 0.2s
      }, conf);

      self.$elem = parent;
      self.$carousel_wrap = $('<div></div>');

      self.view_width = parent[0].offsetWidth;
      self.total_width = 0;
      self.current = self.conf.start;

      self._build();

      return self;
    },

    _build: function() {
      var self = this,
        start_pos = 0,
        box_total_width = 0;

      self.$items = self.$elem.find('.carousel_box');
      self.$items_original = self.$items.clone();
      self.items_length = self.$items.length;
      self.items_len_hidden = 0;

      self.$elem.html(
        self.$carousel_wrap
          .html(
            self.$items
          )
      );

      box_total_width = self.items_length * self.$items[0].offsetWidth;
      if ( box_total_width <= self.view_width ) return;

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

      if ( self.conf.group !== 1 ) {
        self._groupSetup();
        self._cloneGroup();
      } else {
        // clone nodes
        self._cloneItem();
      }

      self.$elem.css({
        overflow: 'hidden',
        position: 'relative'
      });

      // carousel width and height
      start_pos = self.items_len_hidden + self.current - 1;
      self.current_pos = -start_pos * self.item_width;
      self.default_pos = -self.items_len_hidden * self.item_width;
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
      self.move_size = self.item_width;

      if ( self.conf.group === 1 ) {
        self.$items = self.$carousel_wrap.find('.carousel_box');
      } else {
        self.$items = self.$carousel_wrap.find('.carousel_group_inner');
      }
      self._setWidth();
      self.$elem.trigger('carousel.ready');
    },

    _groupSetup: function() {
      var self = this,
        i = 0, k = 0,
        l = self.items_length,
        conf = self.conf,
        division = l / conf.group,
        group_length = Math.ceil(division),
        group = new Array(group_length),
        group_width = self.item_width * conf.group;

      for ( ; i < l; i++ ) {
        if ( i !== 0 && i % conf.group === 0 ) {
          k = k + 1;
        }
        if ( !group[k] ) {
          group[k] = $('<div class="carousel_group_inner"></div>');
          group[k].css({
            float: 'left',
            width: group_width
          });
        }
        group[k].append(self.$items.eq(i));
      }
      for ( i = 0; i < group_length; i++ ) {
        self.$carousel_wrap.append(group[i]);
      }
      self.$items = self.$carousel_wrap.find('.carousel_group_inner');
      self.items_length = self.$items.length;
      self.items_len_hidden = 1;
      self.item_width = self.item_width * conf.group;
    },

    // returns first and last items
    _cloneItem: function() {
      var self = this,
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

    _cloneGroup: function() {
      var self = this,
        len = self.items_len_hidden,
        $first = self.$items.eq(0).clone(),
        $last = self.$items.eq(self.items_length-1).clone();

      self.$items.eq(0).before($last);
      self.$items.eq(self.$items.length-1).after($first);
    },

    // refresh totalWitdh
    _getWidth: function(index) {
      var self = this,
        $items = undefined;

      if ( self.conf.group === 1 ) {
        $items = self.$elem.find('.carousel_box');
      } else {
        $items = self.$elem.find('.carousel_group_inner');
      }

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

    _getNext: function(current) {
      var self = this,
        conf = self.conf;
      if ( current + 1 > self.items_length ) {
        current = 1;
      } else {
        current = current + 1;
      }
      return current;
    },

    _getPrev: function(current) {
      var self = this,
        conf = self.conf;
      if ( current - 1 === 0 ) {
        current = self.items_length;
      } else {
        current = current - 1;
      }
      return current;
    },

    _setCurrent: function(direction) {
      var self = this,
        num = undefined,
        current = self.current;
      // direction: true => next, false => prev
      if ( direction ) {
        num = self._getNext(current);
      } else {
        num = self._getPrev(current);
      }
      self.current = num;
    },

    _toNext: function() {
      var self = this,
        conf = self.conf,
        hidden_len = self.items_len_hidden,
        prop = {};

      self._setCurrent(true);

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
        prop = {};

      self._setCurrent(false);

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

    getCurrent: function() {
      var self = this;
      return self.current - 1;
    },

    prev: function() {
      var self = this;
      self._toPrev();

      return self.$elem;
    },

    next: function() {
      var self = this;
      self._toNext();

      return self.$elem;
    },

    reset: function() {
      var self = this;
      self.$elem
        .empty()
        .append(self.$items_original);

      return self.$elem;
    },

    refresh: function() {
      var self = this;
      self.total_width = 0;
      self._build();

      return self.$elem;
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
    var carousel = Carousel(this, conf);

    extend_method(this, carousel);
    return this;
  };

}(jQuery));
