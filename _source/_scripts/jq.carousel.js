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
        vertical : false,   // boolean
        loop     : true,    // boolean
        easing   : 'swing', // or custom easing
        start    : 1,       // int
        group    : 1,       // int
        duration : 0.2,     // int or float, 0.2 => 0.2s
        indicator: false    // boolean
      }, conf);

      self.$elem = parent;
      self.$carousel_wrap = $('<div></div>');

      self._build();
      self._setIndicator();
      self._eventify();

      return self;
    },

    _build: function() {
      var self = this,
        conf = self.conf,
        start_pos = 0,
        box_total_size = 0;

      self.offset_prop = self.conf.vertical ? 'offsetHeight' : 'offsetWidth';
      self.float = conf.vertical ? 'none' : 'left';
      self.position = conf.vertical ? 'top' : 'left';
      self.prop = conf.vertical ? 'height' : 'width';

      self.view_size = self.$elem[0][self.offset_prop];
      self.total_size = 0;
      self.current = conf.start;

      self.$items = self.$elem.children();
      self.$items_original = self.$items.clone();
      self.items_length = self.$items.length;
      self.items_len_hidden = 0;

      self.$elem.html(
        self.$carousel_wrap
          .html(
            self.$items
          )
      );

      box_total_size = self.items_length * self.$items[0][self.offset_prop];

      // setup
      self.$items.css({
        float: self.float
      });
      each(self.$items, function(i) {
        var item = this;

        item.carousel_id = i;
        item.$elem = $(this);
        item.data_size = item[self.offset_prop];
        item.orig_size = item.$elem.css(self.prop);

        if ( self.items_len_hidden > self.view_size ) return;
        self.items_len_hidden = self.items_len_hidden + item.data_size;
      });
      self.item_size = self.$items.eq(0)[0].data_size;
      self.items_len_hidden = self.items_len_hidden / self.item_size;

      if ( conf.group !== 1 ) {
        self._groupSetup();
        if ( conf.loop ) {
          self._cloneGroup();
        }
      } else {
        // clone nodes
        if ( conf.loop ) {
          self._cloneItem();
        }
      }

      self.$elem.css({
        overflow: 'hidden',
        position: 'relative'
      });

      // carousel width and height
      if ( conf.loop ) {
        start_pos = self.items_len_hidden + self.current - 1;
        self.current_pos = -start_pos * self.item_size;
        self.default_pos = -self.items_len_hidden * self.item_size;
      } else {
        start_pos = self.items_length < conf.start ? 1 : conf.start;
        self.current_pos = -(start_pos-1) * self.item_size;
        self.default_pos = 0;
      }
      self.$carousel_wrap.css({
        position: 'relative'
      })
      .css(self.position, self.current_pos);

      if ( self.vertical ) {
        self.$carousel_wrap.css('width', self.$items.eq(0)[0].offsetWidth);
      } else {
        self.$carousel_wrap.css('height', self.$items.eq(0)[0].offsetHeight);
      }

      // max and min point
      self.max_point = self.default_pos - (self.item_size * self.items_length);
      self.min_point = self.default_pos;

      // move size
      self.move_size = self.item_size;

      if ( conf.group === 1 ) {
        self.$items = self.$carousel_wrap.children();
      } else {
        self.$items = self.$carousel_wrap.find('.carousel_group_inner');
      }
      self._setSize();
      self.$elem.trigger('carousel.ready');
    },

    _eventify: function() {
      var self = this,
        conf = self.conf,
        indicator = undefined;

      if ( !conf.indicator ) {
        return;
      }
      indicator = self.$indicator.data('indicator');
      self.$elem.bind({
        'Carousel.prev': function() {
          indicator.active();
        },
        'Carousel.next': function() {
          indicator.active();
        }
      });
    },

    _groupSetup: function() {
      var self = this,
        i = 0, k = 0,
        l = self.items_length,
        conf = self.conf,
        division = l / conf.group,
        group_length = Math.ceil(division),
        group = new Array(group_length),
        group_size = self.item_size * conf.group;

      for ( ; i < l; i++ ) {
        if ( i !== 0 && i % conf.group === 0 ) {
          k = k + 1;
        }
        if ( !group[k] ) {
          group[k] = $('<div class="carousel_group_inner"></div>');
          group[k]
            .css('float', self.float)
            .css(self.prop, group_size);
        }
        group[k].append(self.$items.eq(i));
      }
      for ( i = 0; i < group_length; i++ ) {
        self.$carousel_wrap.append(group[i]);
      }
      self.$items = self.$carousel_wrap.find('.carousel_group_inner');
      self.items_length = self.$items.length;
      self.items_len_hidden = 1;
      self.item_size = self.item_size * conf.group;
    },

    // returns first and last items
    _cloneItem: function() {
      var self = this,
        len = self.items_len_hidden,
        flexnth = function(state, n) {
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
    _getSize: function(index) {
      var self = this,
        $items = undefined;

      if ( self.conf.group === 1 ) {
        $items = self.$carousel_wrap.children();
      } else {
        $items = self.$elem.find('.carousel_group_inner');
      }

      self.total_size = 0;
      each($items, function(i) {
        var item = this;

        item.data_size = item[self.offset_prop];
        // set total_width
        self.total_size = self.total_size + item.data_size;
      });
    },

    _setSize: function() {
      var self = this;
      self._getSize();
      self.$carousel_wrap
        .css(self.prop, self.total_size);
    },

    _moveState: function() {
      var self = this,
        view_size = self.view_size,
        items_block_size = self.items_length * self.item_size;

      if ( items_block_size <= view_size ) {
        return false;
      } else
      if ( self.current === self.items_length ) {
        return 'max';
      } else
      if ( self.current === 1 ) {
        return 'min';
      } else {
        return true;
      }
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

      if ( !self.conf.loop && self.current === self.items_length ) {
        return;
      }
      self._setCurrent(true);

      self.current_pos = self.current_pos - self.move_size;
      if ( self.current_pos < self.max_point ) {
        self.$carousel_wrap.css(self.position, self.default_pos);
        self.current_pos = self.default_pos - self.move_size;
      }

      prop[self.position] = self.current_pos;

      self.$carousel_wrap
      .animate(prop, {
        queue: false,
        easing: conf.easing,
        duration: conf.duration*1000,
        complete: function() {
          self.$elem.trigger('Carousel.next');
        }
      });
    },

    _toPrev: function() {
      var self = this,
        conf = self.conf,
        hidden_len = self.items_len_hidden,
        total_length = self.items_length + hidden_len,
        items_size = self.item_size * self.items_length,
        prop = {};

      if ( !self.conf.loop && self.current === 1 ) {
        return;
      }
      self._setCurrent(false);

      self.current_pos = self.current_pos + self.move_size;
      if ( self.default_pos < self.current_pos ) {
        self.$carousel_wrap.css(self.position, -self.item_size * total_length);
        self.current_pos = self.default_pos - items_size + self.move_size;
      }

      prop[self.position] = self.current_pos;

      self.$carousel_wrap
      .animate(prop, {
        queue: false,
        easing: conf.easing,
        duration: conf.duration*1000,
        complete: function() {
          self.$elem.trigger('Carousel.prev');
        }
      });

    },

    _getIndicator: function(num) {
      var self = this,
        indicator = Indicator(self, num),
        $indicator = $('<div class="carousel_indicator"></div>');

      $indicator.data('indicator', indicator);
      $indicator.append(indicator.$elems);

      return $indicator;
    },

    _setIndicator: function(num) {
      var self = this,
        indicator = undefined;
      if ( !self.conf.indicator ) {
        return;
      }
      if ( !self.$indicator ) {
        self.$indicator = self._getIndicator(num);
        self.$elem.after(self.$indicator);
      } else {
        indicator = self.$indicator.data('indicator');
        self.$indicator.append(
          indicator.refresh()
        );
      }
    },

    _callAPI: function(api, arguments) {
      var self = this;
      if ( typeof self[api] !== 'function' ) {
        throw api + ' does not exist of Carousel methods.';
      } else
      if ( /^_/.test(api) && typeof self[api] === 'function' ) {
        throw 'Method begins with an underscore are not exposed.';
      }
      return self[api](arguments);
    },

    indicator: function(num) {
      var self = this;
      return self._getIndicator(num);
    },

    getCurrent: function() {
      var self = this;
      return self.current - 1;
    },

    getMoveState: function() {
      var self = this;
      return self._moveState();
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

    reset: function(conf) {
      var self = this;
      self.$elem
        .empty()
        .append(self.$items_original);

      if ( conf ) {
        self.conf = $.extend(self.conf, conf);
      }
      self.$elem.trigger('Carousel.reset');
      return self.$elem;
    },

    refresh: function() {
      var self = this;
      self.total_size = 0;
      self._build();
      self._setIndicator();

      self.$elem.trigger('Carousel.refresh');
      return self.$elem;
    }
  };

  var Indicator = function(carousel, num) {
    this.namespace = 'Indicator';
    if ( this instanceof Indicator ) {
      return this.init(carousel, num);
    }
    return new Indicator(carousel, num);
  };
  Indicator.prototype = {
    init: function(carousel, num) {
      var self = this;
      self.carousel = carousel;
      self._build(num);
    },

    _build: function(num) {
      var self = this,
        carousel = self.carousel,
        current = carousel.getCurrent(),
        i = 0, l = carousel.items_length,
        indi = '',
        active = '';
        for ( ; i < l; i++ ) {
          if ( i === current ) {
            active = ' class="active"';
          } else {
            active = '';
          }
          indi = indi + '<span' + active + '>';
          indi = indi + (num ? i : '');
          indi = indi + '</span>';
        }
        self.$elems = $(indi);
    },

    _setActive: function() {
      var self = this,
        carousel = self.carousel;

        self.$elems.removeClass('active');
        self.$elems.eq(carousel.getCurrent()).addClass('active');
    },

    refresh: function() {
      var self = this;
      self.$elems.remove();
      self._build();
      return self.$elems;
    },

    active: function() {
      var self = this;
      self._setActive();
    }
  };

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

  // $.fn extend
  jQuery.fn.carousel = function(conf, arguments) {
    var carousel = this.data('carousel');

    if ( carousel ) {
      return carousel._callAPI(conf, arguments);
    } else {
      carousel = Carousel(this, conf);
      this.data('carousel', carousel);
      return this;
    }
  };

}(jQuery));
