/**
 * jq.carousele
 *
 * @version      0.1
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/jq.carousel
 *
 * 2012-02-07 19:55
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
				duration: 0.2           // int or float, 0.2 => 0.2s
			}, conf);

			self.$elem = parent;
			self.$carouselWrap = $('<div></div>');

			self.totalWidth = 0;
			self.currentItem = 0;

			self.$items = parent.find('.carousel_box');
			self.itemsLength = self.$items.length;

			self.$elem.append(
				self.$carouselWrap
					.append(
						self.$items
					)
			);

			// setup
			each(self.$items, function(i) {
				var item = this;

				item.carouselId = i;
				item.$elem = $(this);
				item.dataWidth = item.offsetWidth;
				item.origWidth = item.$elem.css('width');
				item.$elem.css({
					float: 'left'
				});

				// set totalWidth
				//self.totalWidth = self.totalWidth + item.dataWidth;
			});

			// clone nodes

			self.$elem.css({
				overflow: 'hidden'
			});

			// carousel width and height
			self.$carouselWrap.css({
				//width: self.totalWidth,
				marginLeft: '-' + self.$items.eq(0)[0].dataWidth + 'px',
				height: self.$items.eq(0)[0].offsetHeight
			});

			cloned = self._cloneItem();
			self.$items
				// first item
				.eq(0)
					.before(cloned.last)
				.end()
				// last item
				.eq(self.itemsLength-1)
					.after(cloned.first);

			self.$items = self.$carouselWrap.find('.carousel_box');
			self._setWidth();
			self.$elem.trigger('carousel.ready');

			return self;
		},

		_eventify: function() {
			var self = this;

		},

		_getItem: function(i) {
			var self = this,
				$item = undefined;
			each(self.$items, function(val, i) {
				if ( val[0].carouselId !== i ) return;
				$item = val[0];
			});
			return $item;
		},

		// returns first and last items
		_cloneItem: function() {
			var self = this,
				$items = self.$elem.find('.carousel_box'),
				$first = $items.eq(0).clone(),
				$last = $items.eq(self.itemsLength-1).clone();

			return {
				first: $first,
				last : $last
			};
		},

		_setPosition: function() {
			var self = this;
		},

		// refresh totalWitdh
		_getWidth: function(index) {
			var self = this,
				$items = self.$elem.find('.carousel_box');

			self.totalWidth = 0;
			each($items, function(i) {
				var item = this;

				item.dataWidth = item.offsetWidth;
				// set totalWidth
				self.totalWidth = self.totalWidth + item.dataWidth;
			});
		},

		_setWidth: function() {
			var self = this;
			self._getWidth();
			self.$carouselWrap.css({
				width: self.totalWidth
			});
		},

		_getNext: function(i) {
			var self = this;
			if ( i > 0 ) {
				if ( i + 1 >= self.itemLength - 1 ) {
					i = 0;
				} else {
					i = i + 1;
				}
			} else {
				if ( i + 1 <= 0 ) {
					i = self.itemLength - 1;
				} else {
					i = i + 1;
				}
			}
			return i;
		},

		_toPrev: function() {
			var self = this,
				dfd = $.Deferred(),
				$first = self.$items.eq(0),
				next = self._getNext(self.currentItem);

			if ( self.currentItem + 1 >= self.$items.length - 1 ) {
				self.current = 0;
			} else {
				self.current = self.current + 1;
			}

			$first.animate({
				width: 0
			}, {
				easing: 'swing',
				duration: 200,
				queue: false,
				complete: function() {
					$first.remove();
					self.$items = self.$elem.find('.carousel_box');
					self.$elem.trigger('carousel.moved');

					dfd.resolve();
				}
			});

			return dfd.promise();
		},

		_toNext: function() {
			var self = this,
				dfd = $.Deferred(),
				$last = self.$items.eq(self.$items.length - 1);

			$last
				.css({
					width: 0
				})
				.before(self.$items.eq(0))
				.animate({
					width: $last[0].dataWidth
				}, {
					easing: 'swing',
					duration: 200,
					complete: function() {
						
					}
				});

			self.$items = self.$elem.find('.carousel_box');
			self.$elem.trigger('carousel.moved');
			return dfd.promise();
		},

		_toN: function(n) {
			var dfd = $.Deferred();

			return dfd.promise();
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
			namespace = toFirstLetterLowerCase(obj.namespace),
			method_name = undefined;
		for ( c in obj ) {
			if ( typeof obj[c] !== 'function'
			  || /(?:^_)|(?:^handleEvent$)|(?:^init$)/.test(c) ) {
				continue;
			}
			method_name = namespace + toFirstLetterUpperCase(c);
			base[method_name] = (function() {
				var p = c;
				return function(arguments) {
					return obj[p](arguments);
				}
			}());
		}
	}

	function toFirstLetterUpperCase(string) {
		return string.replace(
			/(^[a-z])/,
			function($1) {
				return $1.toUpperCase();
			}
		);
	}

	function toFirstLetterLowerCase(string) {
		return string.replace(
			/(^[A-Z])/,
			function($1) {
				return $1.toLowerCase();
			}
		);
	}

	function each(arr, func) {
		var i = 0,
			l = arr.length;

		for ( ; i < l; i = i + 1 ) {
			func.apply(arr[i], ([i]).concat(arguments));
		}
	}

	// method extend
	$.carousel = Carousel;
	// $.fn extend
	$.fn.carousel = function(conf) {
		var type = Carousel(this, conf);

		extend_method(this, type);
		return this;
	};
	
}(jQuery));
