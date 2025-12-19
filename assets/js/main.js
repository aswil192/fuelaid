 AOS.init({
 	duration: 800,
 	easing: 'slide'
 });

(function($) {

	"use strict";

	$(window).stellar({
    responsive: false,
    parallaxBackgrounds: true,
    parallaxElements: true,
    horizontalScrolling: false,
    hideDistantElements: false,
    scrollProperty: 'scroll'
  });


	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	// loader
	var loader = function() {
		setTimeout(function() { 
			if($('#ftco-loader').length > 0) {
				$('#ftco-loader').removeClass('show');
			}
		}, 1);
	};
	loader();

	// Scrollax
   $.Scrollax();

	var carousel = function() {
		$('.carousel-cause').owlCarousel({
			autoplay: true,
			center: true,
			loop: true,
			items:1,
			margin: 30,
			stagePadding:0,
			nav: true,
			navText: ['<span class="ion-ios-arrow-back">', '<span class="ion-ios-arrow-forward">'],
			responsive:{
				0:{
					items: 1,
					stagePadding: 0
				},
				600:{
					items: 2,
					stagePadding: 50
				},
				1000:{
					items: 3,
					stagePadding: 100
				}
			}
		});

	};
	carousel();

	$('nav .dropdown').hover(function(){
		var $this = $(this);
		// 	 timer;
		// clearTimeout(timer);
		$this.addClass('show');
		$this.find('> a').attr('aria-expanded', true);
		// $this.find('.dropdown-menu').addClass('animated-fast fadeInUp show');
		$this.find('.dropdown-menu').addClass('show');
	}, function(){
		var $this = $(this);
			// timer;
		// timer = setTimeout(function(){
			$this.removeClass('show');
			$this.find('> a').attr('aria-expanded', false);
			// $this.find('.dropdown-menu').removeClass('animated-fast fadeInUp show');
			$this.find('.dropdown-menu').removeClass('show');
		// }, 100);
	});


	$('#dropdown04').on('show.bs.dropdown', function () {
	  console.log('show');
	});

	// scroll
	var scrollWindow = function() {
		$(window).scroll(function(){
			var $w = $(this),
					st = $w.scrollTop(),
					navbar = $('.ftco_navbar'),
					sd = $('.js-scroll-wrap');

			if (st > 150) {
				if ( !navbar.hasClass('scrolled') ) {
					navbar.addClass('scrolled');	
				}
			} 
			if (st < 150) {
				if ( navbar.hasClass('scrolled') ) {
					navbar.removeClass('scrolled sleep');
				}
			} 
			if ( st > 350 ) {
				if ( !navbar.hasClass('awake') ) {
					navbar.addClass('awake');	
				}
				
				if(sd.length > 0) {
					sd.addClass('sleep');
				}
			}
			if ( st < 350 ) {
				if ( navbar.hasClass('awake') ) {
					navbar.removeClass('awake');
					navbar.addClass('sleep');
				}
				if(sd.length > 0) {
					sd.removeClass('sleep');
				}
			}
		});
	};
	scrollWindow();

	var isMobile = {
		Android: function() {
			return navigator.usermechanic.match(/Android/i);
		},
			BlackBerry: function() {
			return navigator.usermechanic.match(/BlackBerry/i);
		},
			iOS: function() {
			return navigator.usermechanic.match(/iPhone|iPad|iPod/i);
		},
			Opera: function() {
			return navigator.usermechanic.match(/Opera Mini/i);
		},
			Windows: function() {
			return navigator.usermechanic.match(/IEMobile/i);
		},
			any: function() {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	};

	
	var counter = function() {
		
		$('#section-counter').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {

				var comma_separator_number_step = $.animateNumber.numberStepFactories.separator(',')
				$('.number').each(function(){
					var $this = $(this),
						num = $this.data('number');
						console.log(num);
					$this.animateNumber(
					  {
					    number: num,
					    numberStep: comma_separator_number_step
					  }, 7000
					);
				});
				
			}

		} , { offset: '95%' } );

	}
	counter();

	var contentWayPoint = function() {
		var i = 0;
		$('.ftco-animate').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {
				
				i++;

				$(this.element).addClass('item-animate');
				setTimeout(function(){

					$('body .ftco-animate.item-animate').each(function(k){
						var el = $(this);
						setTimeout( function () {
							var effect = el.data('animate-effect');
							if ( effect === 'fadeIn') {
								el.addClass('fadeIn ftco-animated');
							} else if ( effect === 'fadeInLeft') {
								el.addClass('fadeInLeft ftco-animated');
							} else if ( effect === 'fadeInRight') {
								el.addClass('fadeInRight ftco-animated');
							} else {
								el.addClass('fadeInUp ftco-animated');
							}
							el.removeClass('item-animate');
						},  k * 50, 'easeInOutExpo' );
					});
					
				}, 100);
				
			}

		} , { offset: '95%' } );
	};
	contentWayPoint();


	// navigation
	var OnePageNav = function() {
		$(".smoothscroll[href^='#'], #ftco-nav ul li a[href^='#']").on('click', function(e) {
		 	e.preventDefault();

		 	var hash = this.hash,
		 			navToggler = $('.navbar-toggler');
		 	$('html, body').animate({
		    scrollTop: $(hash).offset().top
		  }, 700, 'easeInOutExpo', function(){
		    window.location.hash = hash;
		  });


		  if ( navToggler.is(':visible') ) {
		  	navToggler.click();
		  }
		});
		$('body').on('activate.bs.scrollspy', function () {
		  console.log('nice');
		})
	};
	OnePageNav();


	// magnific popup
	$('.image-popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    fixedContentPos: true,
    mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
     gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      verticalFit: true
    },
    zoom: {
      enabled: true,
      duration: 300 // don't foget to change the duration also in CSS
    }
  });

  $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
    disableOn: 700,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,

    fixedContentPos: false
  });


  $('#appointment_date').datepicker({
	  'format': 'm/d/yyyy',
	  'autoclose': true
	});

	$('#appointment_time').timepicker();




})(jQuery);

    document.querySelectorAll('.role-btn').forEach(button => {
      button.addEventListener('click', function () {
        let role = this.getAttribute('data-role');
        window.location.href = `/auth/login?role=${role}`;
      });
    });
  
  $(document).ready(function () {
    // When modal is opened, allow scrolling
    $('#roleSelectionModal').on('shown.bs.modal', function () {
      $('body').addClass('modal-open');
    });

    // When modal is closed, restore normal scrolling
    $('#roleSelectionModal').on('hidden.bs.modal', function () {
      $('body').removeClass('modal-open');
    });

    // Ensure modal remains scrollable if it overflows on small screens
    $('.modal-content').css('max-height', $(window).height() * 0.9);
  });

    document.getElementById("onDemandBtn").addEventListener("click", function() {
        document.getElementById("onDemandSection").style.display = "block";
        document.getElementById("subscriptionSection").style.display = "none";
        this.classList.add("active");
        document.getElementById("subscriptionBtn").classList.remove("active");
    });

    document.getElementById("subscriptionBtn").addEventListener("click", function() {
        document.getElementById("subscriptionSection").style.display = "block";
        document.getElementById("onDemandSection").style.display = "none";
        this.classList.add("active");
        document.getElementById("onDemandBtn").classList.remove("active");
    });

	document.addEventListener("DOMContentLoaded", function () {
    const elements = document.querySelectorAll(".service-box, .arrow-icon");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add("show");
                }, index * 800); // Increased delay for clearer effect
            } else {
                // Reset animation when out of view
                entry.target.classList.remove("show");
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(element => observer.observe(element));
});

  document.getElementById("role").addEventListener("change", function() {
    let mechanicForm = document.getElementById("mechanicForm");
    let fuelDeliveryForm = document.getElementById("fuelDeliveryForm");
  
    mechanicForm.style.display = "none";
    fuelDeliveryForm.style.display = "none";
  
    if (this.value === "mechanic") {
        mechanicForm.style.display = "block";
    } else if (this.value === "fuelDelivery") {
        fuelDeliveryForm.style.display = "block";
    }
  });

   document.getElementById("jobApplicationForm").addEventListener("submit", async function (event) {
      event.preventDefault();
  
      let role = document.getElementById("role").value;
      let activeForm;
      
      // Determine which form is active
      if (role === "mechanic") {
          activeForm = document.getElementById("mechanicForm");
      } else if (role === "fuelDelivery") {
          activeForm = document.getElementById("fuelDeliveryForm");
      } else {
          alert("Please select a valid role.");
          return;
      }
  
      let formData = new FormData();
      formData.append("role", role);
  
      // Collect data only from the visible form
      activeForm.querySelectorAll("input, select, textarea").forEach(input => {
          if (input.value.trim() !== "") {
              if (input.type === "file") {
                  if (input.files.length > 0) {
                      formData.append(input.name, input.files[0]);
                  }
              } else {
                  formData.append(input.name, input.value);
              }
          }
      });
  
      let apiUrl = `http://localhost:5000/api/jobs/${role}`;
  
      try {
          let response = await fetch(apiUrl, {
              method: "POST",
              body: formData
          });
  
          let result = await response.json();
          alert(result.message);
          this.reset();
      } catch (err) {
          alert("Error submitting application: " + err.message);
      }
  });
  
document.querySelector('.features-section').addEventListener('mouseenter', function() {
    let boxes = document.querySelectorAll('.feature-box');
    
    boxes.forEach((box, index) => {
        box.style.opacity = "0"; // Reset opacity to re-trigger animation
        box.style.transform = "translateY(30px)"; // Reset position
        box.style.animation = "none"; // Reset animation

        setTimeout(() => {
            box.style.animation = `fadeInUp 0.8s ease-in-out ${index * 0.5}s forwards`;
        }, 10); // Small delay to allow reset
    });
});

  document.addEventListener("DOMContentLoaded", () => {
    const boxes = document.querySelectorAll('.port-box');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animated');
                    entry.target.querySelector('.port-content').classList.add('show');
                }, index * 200); // Adjust the delay for staggered animation
                
                // Hide the text after some time
                setTimeout(() => {
                    entry.target.querySelector('.port-content').classList.remove('show');
                }, 2000); // Text stays visible for 3 seconds

            } else {
                entry.target.classList.remove('animated');
                entry.target.querySelector('.port-content').classList.remove('show');
            }
        });
    }, observerOptions);

    boxes.forEach(box => {
        observer.observe(box);
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const faders = document.querySelectorAll(".fade-in");

    const appearOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      });
    }, appearOptions);

    faders.forEach(fader => {
      appearOnScroll.observe(fader);
    });
  });

