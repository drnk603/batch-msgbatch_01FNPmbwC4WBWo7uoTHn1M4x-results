(function() {
  'use strict';

  if (window.__app) {
    return;
  }

  window.__app = {};

  const _raf = window.requestAnimationFrame || function(cb) { return setTimeout(cb, 16); };
  const _caf = window.cancelAnimationFrame || clearTimeout;

  function debounce(fn, ms) {
    let timer;
    return function() {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(ctx, args);
      }, ms);
    };
  }

  function throttle(fn, ms) {
    let last = 0;
    return function() {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  function getHeaderHeight() {
    const hdr = document.querySelector('.l-header');
    return hdr ? (hdr.offsetHeight || 80) : 80;
  }

  function enableBodyScroll() {
    document.body.classList.remove('u-no-scroll');
  }

  function disableBodyScroll() {
    document.body.classList.add('u-no-scroll');
  }

  function trapFocus(container, toggle) {
    const focusable = container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === toggle) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    container.addEventListener('keydown', handler);
    return function() {
      container.removeEventListener('keydown', handler);
    };
  }

  const burgerModule = {
    init: function() {
      if (__app.burgerInit) return;
      __app.burgerInit = true;
      const nav = document.querySelector('.c-nav#main-nav');
      const toggle = document.querySelector('.c-nav__toggle');
      const navList = document.querySelector('.c-nav__list');
      if (!nav || !toggle || !navList) return;
      let releaseTrap = null;
      function openMenu() {
        nav.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        disableBodyScroll();
        releaseTrap = trapFocus(navList, toggle);
      }
      function closeMenu() {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        enableBodyScroll();
        if (releaseTrap) {
          releaseTrap();
          releaseTrap = null;
        }
      }
      toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        if (nav.classList.contains('is-open')) {
          closeMenu();
        } else {
          openMenu();
        }
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) {
          closeMenu();
        }
      });
      document.addEventListener('click', function(e) {
        if (nav.classList.contains('is-open') && !nav.contains(e.target)) {
          closeMenu();
        }
      });
      const links = navList.querySelectorAll('.c-nav__link');
      for (let i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function() {
          closeMenu();
        });
      }
      window.addEventListener('resize', throttle(function() {
        if (window.innerWidth >= 1024 && nav.classList.contains('is-open')) {
          closeMenu();
        }
      }, 200));
    }
  };

  const anchorModule = {
    init: function() {
      if (__app.anchorInit) return;
      __app.anchorInit = true;
      const path = location.pathname;
      const isHome = (path === '/' || path === '/index.html' || path === 'index.html');
      if (!isHome) {
        const allLinks = document.querySelectorAll('a[href^="#"]');
        for (let i = 0; i < allLinks.length; i++) {
          const link = allLinks[i];
          const href = link.getAttribute('href');
          if (href === '#' || href === '#!') continue;
          if (href.charAt(0) === '#') {
            link.setAttribute('href', '/' + href);
          }
        }
      }
      document.addEventListener('click', function(e) {
        let target = e.target;
        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }
        if (!target || !target.hasAttribute('href')) return;
        const href = target.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;
        const match = href.match(/^\/?#(.+)$/);
        if (match) {
          e.preventDefault();
          const id = match[1];
          const el = document.getElementById(id);
          if (el) {
            const offset = getHeaderHeight();
            const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
              top: top,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  };

  const activeMenuModule = {
    init: function() {
      if (__app.activeMenuInit) return;
      __app.activeMenuInit = true;
      const path = location.pathname;
      const links = document.querySelectorAll('.c-nav__link');
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const href = link.getAttribute('href') || '';
        const linkPath = href.split('#')[0] || '/';
        if (linkPath === path || (path === '/' || path === '/index.html') && (linkPath === '/' || linkPath === '/index.html' || linkPath === 'index.html')) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('active');
          break;
        }
      }
    }
  };

  const scrollSpyModule = {
    init: function() {
      if (__app.scrollSpyInit) return;
      __app.scrollSpyInit = true;
      const sections = document.querySelectorAll('section[id]');
      if (!sections.length) return;
      const links = document.querySelectorAll('.c-nav__link[href^="#"]');
      if (!links.length) return;
      function updateActive() {
        const scrollY = window.pageYOffset;
        const offset = getHeaderHeight() + 50;
        let current = '';
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const sectionTop = section.offsetTop - offset;
          const sectionBottom = sectionTop + section.offsetHeight;
          if (scrollY >= sectionTop && scrollY < sectionBottom) {
            current = section.getAttribute('id');
          }
        }
        for (let j = 0; j < links.length; j++) {
          const link = links[j];
          const href = link.getAttribute('href');
          if (href && href.includes('#')) {
            const id = href.split('#')[1];
            if (id === current) {
              link.classList.add('active');
              link.setAttribute('aria-current', 'page');
            } else {
              link.classList.remove('active');
              link.removeAttribute('aria-current');
            }
          }
        }
      }
      window.addEventListener('scroll', throttle(updateActive, 100));
      updateActive();
    }
  };

  const imageModule = {
    init: function() {
      if (__app.imageInit) return;
      __app.imageInit = true;
      const images = document.querySelectorAll('img');
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.classList.contains('img-fluid')) {
          img.classList.add('img-fluid');
        }
        const isCritical = img.hasAttribute('data-critical');
        const isLogo = img.classList.contains('c-logo__img');
        if (!img.hasAttribute('loading') && !isCritical && !isLogo) {
          img.setAttribute('loading', 'lazy');
        }
        (function(image) {
          image.addEventListener('error', function() {
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e0e0e0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="14">Image</text></svg>';
            const encoded = 'data:image/svg+xml;base64,' + btoa(svg);
            image.src = encoded;
            image.style.objectFit = 'contain';
            if (image.classList.contains('c-logo__img')) {
              image.style.maxHeight = '40px';
            }
          });
        })(img);
      }
    }
  };

  const formModule = {
    init: function() {
      if (__app.formInit) return;
      __app.formInit = true;
      const toastContainer = document.createElement('div');
      toastContainer.className = 'position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
      __app.notify = function(message, type) {
        type = type || 'info';
        const alert = document.createElement('div');
        alert.className = 'alert alert-' + type + ' alert-dismissible fade show';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
        toastContainer.appendChild(alert);
        setTimeout(function() {
          alert.classList.remove('show');
          setTimeout(function() {
            if (alert.parentNode) {
              alert.parentNode.removeChild(alert);
            }
          }, 150);
        }, 5000);
      };
      const forms = document.querySelectorAll('.c-form');
      for (let i = 0; i < forms.length; i++) {
        (function(form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            let isValid = true;
            const errors = [];
            const firstName = form.querySelector('#firstName, #contact-first-name');
            if (firstName && firstName.hasAttribute('required')) {
              const val = firstName.value.trim();
              if (val === '') {
                isValid = false;
                errors.push('Vārds ir obligāts');
                firstName.classList.add('is-invalid');
              } else if (!/^[a-zA-ZÀ-ÿ\s\-']{2,50}$/.test(val)) {
                isValid = false;
                errors.push('Vārds nav derīgs (2-50 burti)');
                firstName.classList.add('is-invalid');
              } else {
                firstName.classList.remove('is-invalid');
              }
            }
            const lastName = form.querySelector('#lastName, #contact-last-name');
            if (lastName && lastName.hasAttribute('required')) {
              const val = lastName.value.trim();
              if (val === '') {
                isValid = false;
                errors.push('Uzvārds ir obligāts');
                lastName.classList.add('is-invalid');
              } else if (!/^[a-zA-ZÀ-ÿ\s\-']{2,50}$/.test(val)) {
                isValid = false;
                errors.push('Uzvārds nav derīgs (2-50 burti)');
                lastName.classList.add('is-invalid');
              } else {
                lastName.classList.remove('is-invalid');
              }
            }
            const email = form.querySelector('#email, #contact-email');
            if (email && email.hasAttribute('required')) {
              const val = email.value.trim();
              if (val === '') {
                isValid = false;
                errors.push('E-pasts ir obligāts');
                email.classList.add('is-invalid');
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                isValid = false;
                errors.push('E-pasta formāts nav derīgs');
                email.classList.add('is-invalid');
              } else {
                email.classList.remove('is-invalid');
              }
            }
            const phone = form.querySelector('#phone, #contact-phone');
            if (phone && phone.hasAttribute('required')) {
              const val = phone.value.trim();
              if (val === '') {
                isValid = false;
                errors.push('Tālrunis ir obligāts');
                phone.classList.add('is-invalid');
              } else if (!/^[\+\d\s\-\(\)]{8,20}$/.test(val)) {
                isValid = false;
                errors.push('Tālruņa numurs nav derīgs (8-20 cipari)');
                phone.classList.add('is-invalid');
              } else {
                phone.classList.remove('is-invalid');
              }
            }
            const carModel = form.querySelector('#carModel');
            if (carModel && carModel.hasAttribute('required')) {
              const val = carModel.value.trim();
              if (val === '') {
                isValid = false;
                errors.push('Auto modelis ir obligāts');
                carModel.classList.add('is-invalid');
              } else {
                carModel.classList.remove('is-invalid');
              }
            }
            const carYear = form.querySelector('#carYear');
            if (carYear && carYear.hasAttribute('required')) {
              const val = carYear.value.trim();
              const year = parseInt(val, 10);
              const min = parseInt(carYear.getAttribute('min') || '1980', 10);
              const max = parseInt(carYear.getAttribute('max') || '2025', 10);
              if (val === '' || isNaN(year)) {
                isValid = false;
                errors.push('Gads ir obligāts');
                carYear.classList.add('is-invalid');
              } else if (year < min || year > max) {
                isValid = false;
                errors.push('Gads jābūt starp ' + min + ' un ' + max);
                carYear.classList.add('is-invalid');
              } else {
                carYear.classList.remove('is-invalid');
              }
            }
            const insuranceType = form.querySelector('#insuranceType, #contact-insurance-type');
            if (insuranceType && insuranceType.hasAttribute('required')) {
              const val = insuranceType.value.trim();
              if (val === '' || val === 'Izvēlieties apdrošināšanas veidu') {
                isValid = false;
                errors.push('Apdrošināšanas veids ir obligāts');
                insuranceType.classList.add('is-invalid');
              } else {
                insuranceType.classList.remove('is-invalid');
              }
            }
            const message = form.querySelector('#message, #contact-message');
            if (message && message.hasAttribute('required')) {
              const val = message.value.trim();
              if (val === '') {
                isValid = false;
                errors.push('Ziņojums ir obligāts');
                message.classList.add('is-invalid');
              } else if (val.length < 10) {
                isValid = false;
                errors.push('Ziņojums jābūt vismaz 10 rakstzīmes');
                message.classList.add('is-invalid');
              } else {
                message.classList.remove('is-invalid');
              }
            }
            const privacyConsent = form.querySelector('#privacyConsent, #contact-privacy');
            if (privacyConsent && privacyConsent.hasAttribute('required')) {
              if (!privacyConsent.checked) {
                isValid = false;
                errors.push('Jāpiekrīt privātuma politikai');
                privacyConsent.classList.add('is-invalid');
              } else {
                privacyConsent.classList.remove('is-invalid');
              }
            }
            if (!isValid) {
              __app.notify('Kļūda: ' + errors.join(', '), 'danger');
              return;
            }
            const btn = form.querySelector('[type="submit"]');
            let originalText = btn ? btn.innerHTML : '';
            if (btn) {
              btn.disabled = true;
              btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Nosūta...';
            }
            const data = {};
            const inputs = form.querySelectorAll('input,textarea,select');
            for (let j = 0; j < inputs.length; j++) {
              const inp = inputs[j];
              if (inp.name) {
                data[inp.name] = inp.type === 'checkbox' ? inp.checked : inp.value;
              }
            }
            setTimeout(function() {
              if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
              }
              __app.notify('Paldies! Jūsu pieprasījums ir nosūtīts.', 'success');
              form.reset();
              const invalids = form.querySelectorAll('.is-invalid');
              for (let k = 0; k < invalids.length; k++) {
                invalids[k].classList.remove('is-invalid');
              }
              setTimeout(function() {
                window.location.href = 'thank_you.html';
              }, 1500);
            }, 1000);
          });
        })(forms[i]);
      }
    }
  };

  const accordionModule = {
    init: function() {
      if (__app.accordionInit) return;
      __app.accordionInit = true;
      const accordions = document.querySelectorAll('.accordion');
      for (let i = 0; i < accordions.length; i++) {
        const accordion = accordions[i];
        const buttons = accordion.querySelectorAll('.accordion-button');
        for (let j = 0; j < buttons.length; j++) {
          (function(btn) {
            btn.addEventListener('click', function() {
              const target = btn.getAttribute('data-bs-target');
              if (!target) return;
              const collapse = document.querySelector(target);
              if (!collapse) return;
              const isExpanded = btn.getAttribute('aria-expanded') === 'true';
              if (isExpanded) {
                collapse.classList.remove('show');
                btn.setAttribute('aria-expanded', 'false');
                btn.classList.add('collapsed');
              } else {
                collapse.classList.add('show');
                btn.setAttribute('aria-expanded', 'true');
                btn.classList.remove('collapsed');
              }
            });
          })(buttons[j]);
        }
      }
    }
  };

  const scrollToTopModule = {
    init: function() {
      if (__app.scrollToTopInit) return;
      __app.scrollToTopInit = true;
      const btn = document.createElement('button');
      btn.className = 'c-scroll-to-top';
      btn.innerHTML = '↑';
      btn.setAttribute('aria-label', 'Atgriezties augšā');
      btn.style.cssText = 'position:fixed;bottom:2rem;right:2rem;width:48px;height:48px;border-radius:50%;background:var(--color-primary);color:#fff;border:none;font-size:1.5rem;cursor:pointer;opacity:0;visibility:hidden;transition:all 0.3s;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
      document.body.appendChild(btn);
      function toggle() {
        if (window.pageYOffset > 300) {
          btn.style.opacity = '1';
          btn.style.visibility = 'visible';
        } else {
          btn.style.opacity = '0';
          btn.style.visibility = 'hidden';
        }
      }
      window.addEventListener('scroll', throttle(toggle, 100));
      btn.addEventListener('click', function() {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
      toggle();
    }
  };

  const modalModule = {
    init: function() {
      if (__app.modalInit) return;
      __app.modalInit = true;
      const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
      for (let i = 0; i < privacyLinks.length; i++) {
        const link = privacyLinks[i];
        const href = link.getAttribute('href');
        if (href && (href.includes('privacy.html') || href.includes('#privacy'))) {
          link.addEventListener('click', function(e) {
            const target = e.target.getAttribute('href');
            if (target && target.includes('.html')) {
              return;
            }
            e.preventDefault();
            __app.notify('Privātuma politika tiek ielādēta...', 'info');
          });
        }
      }
    }
  };

  __app.init = function() {
    burgerModule.init();
    anchorModule.init();
    activeMenuModule.init();
    scrollSpyModule.init();
    imageModule.init();
    formModule.init();
    accordionModule.init();
    scrollToTopModule.init();
    modalModule.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __app.init);
  } else {
    __app.init();
  }
})();