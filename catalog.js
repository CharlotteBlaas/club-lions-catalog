(function () {
  const catalog = document.querySelector('#clAssortment');
  if (!catalog) return;

  const selectedProducts = {};
  let activeModalCard = null;
  let lastFocusedElement = null;

  const mailTo = 'bestellingen@example.com'; // Vervang door het definitieve besteladres.
  const mailSubject = 'Bestelaanvraag Club Lions assortiment';

  const brandButtons = catalog.querySelectorAll('.cl-brand-card');
  const brandSections = catalog.querySelectorAll('.cl-products-section');

  const summaryList = catalog.querySelector('.cl-summary__list');
  const emptyText = catalog.querySelector('.cl-summary__empty');
  const mailButton = catalog.querySelector('.cl-summary__mail');
  const customerDataElement = catalog.querySelector('.cl-customer-data');

  const modal = catalog.querySelector('#clProductModal');
  const modalContent = catalog.querySelector('.cl-modal__content');
  const modalClose = catalog.querySelector('.cl-modal__close');
  const modalImage = catalog.querySelector('.cl-modal__image');
  const modalImagePlaceholder = catalog.querySelector('.cl-modal__image-placeholder');
  const modalTitle = catalog.querySelector('.cl-modal__title');
  const modalDescription = catalog.querySelector('.cl-modal__description');
  const modalSpecs = catalog.querySelector('.cl-modal__specs');
  const modalQuantity = catalog.querySelector('.cl-modal__quantity');
  const modalAddButton = catalog.querySelector('.cl-modal__add');

  function isUnresolvedPlaceholder(value) {
    return !value || /^\s*[\{\[].*[\}\]]\s*$/.test(value);
  }

  function getCustomerData() {
    if (!customerDataElement) {
      return {
        customerNumber: '',
        customerName: '',
        companyName: '',
        phone: ''
      };
    }

    const values = {
      customerNumber: customerDataElement.dataset.customerNumber || '',
      customerName: customerDataElement.dataset.customerName || '',
      companyName: customerDataElement.dataset.companyName || '',
      phone: customerDataElement.dataset.phone || ''
    };

    Object.keys(values).forEach(function (key) {
      if (isUnresolvedPlaceholder(values[key])) {
        values[key] = '';
      }
    });

    return values;
  }

  function getProductImage(card) {
    const image = card.querySelector('img.cl-product-card__image');
    return image ? image.src : '';
  }

  function getProductFromCard(card, quantity) {
    const code = card.dataset.productCode || 'XXXXXXX';
    const name = card.dataset.productName || '';
    const key = code + '|' + name;

    return {
      key: key,
      name: name,
      code: code,
      brand: card.dataset.brand || '',
      format: card.dataset.format || '',
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      image: getProductImage(card)
    };
  }

  function addProduct(card, quantity) {
    const product = getProductFromCard(card, quantity);
    selectedProducts[product.key] = product;
    renderSummary();
  }

  function showBrand(brand) {
    brandButtons.forEach(function (button) {
      const isActive = button.dataset.brandTarget === brand;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    brandSections.forEach(function (section) {
      section.classList.toggle(
        'is-active',
        section.dataset.brandSection === brand
      );
    });
  }

  function renderSummary() {
    const products = Object.values(selectedProducts);
    summaryList.innerHTML = '';

    if (!products.length) {
      emptyText.style.display = 'block';
      mailButton.style.opacity = '0.5';
      mailButton.style.pointerEvents = 'none';
      mailButton.setAttribute('aria-disabled', 'true');
      mailButton.href = '#';
      return;
    }

    emptyText.style.display = 'none';
    mailButton.style.opacity = '1';
    mailButton.style.pointerEvents = 'auto';
    mailButton.removeAttribute('aria-disabled');

    products.forEach(function (product) {
      const item = document.createElement('li');

      const imageMarkup = product.image
        ? `<img class="cl-summary__image" src="${product.image}" alt="">`
        : `<div class="cl-summary__image-placeholder" aria-hidden="true">${product.brand}</div>`;

      item.innerHTML = `
        ${imageMarkup}
        <div>
          <div class="cl-summary__product-title">
            ${product.name}
          </div>
          <div class="cl-summary__product-meta">
            Artikelnummer: ${product.code}<br>
            Merk: ${product.brand}<br>
            Formaat: ${product.format}<br>
            Aantal kisten: ${product.quantity}
          </div>
        </div>
        <button
          type="button"
          class="cl-summary__remove"
          data-key="${product.key}"
        >
          Verwijderen
        </button>
      `;

      summaryList.appendChild(item);
    });

    updateMailLink(products);
  }

  function updateMailLink(products) {
    const customer = getCustomerData();
    const lines = [
      'Beste Customer Service,',
      '',
      'Graag ontvang ik onderstaande producten:',
      ''
    ];

    products.forEach(function (product) {
      lines.push(
        `${product.code} - ${product.name} - ${product.quantity} kist(en)`
      );
    });

    lines.push('');
    lines.push('Klantgegevens:');
    lines.push('Klantnummer: ' + (customer.customerNumber || 'Niet automatisch beschikbaar'));
    lines.push('Naam: ' + (customer.customerName || 'Niet automatisch beschikbaar'));
    lines.push('Bedrijf: ' + (customer.companyName || 'Niet automatisch beschikbaar'));
    lines.push('Telefoonnummer: ' + (customer.phone || 'Niet automatisch beschikbaar'));
    lines.push('');
    lines.push('Met vriendelijke groet,');

    mailButton.href =
      'mailto:' +
      encodeURIComponent(mailTo) +
      '?subject=' +
      encodeURIComponent(mailSubject) +
      '&body=' +
      encodeURIComponent(lines.join('\n'));
  }

  function openDetails(card) {
    activeModalCard = card;
    lastFocusedElement = document.activeElement;

    const imageUrl = getProductImage(card);
    const productName = card.dataset.productName || '';

    if (imageUrl) {
      modalImage.src = imageUrl;
      modalImage.alt = productName;
      modalImage.style.display = 'block';
      modalImagePlaceholder.style.display = 'none';
    } else {
      modalImage.removeAttribute('src');
      modalImage.alt = '';
      modalImage.style.display = 'none';
      modalImagePlaceholder.textContent = card.dataset.brand || productName;
      modalImagePlaceholder.style.display = 'flex';
    }

    modalTitle.textContent = productName;
    modalDescription.textContent = card.dataset.description || '';
    modalQuantity.value = 1;

    const specs = [
      ['Merk', card.dataset.brand],
      ['Artikelnummer', card.dataset.productCode || 'XXXXXXX'],
      ['Besteleenheid', 'Per kist (1 = 1 kist)'],
      ['Sigarenformaat', card.dataset.format],
      ['Herkomst', card.dataset.origin],
      ['Type dekblad', card.dataset.wrapper],
      ['Omblad', card.dataset.binder],
      ['Binnengoed', card.dataset.filler],
      ['Smaakprofiel', card.dataset.flavour],
      ['Smaakbeleving', card.dataset.strength]
    ];

    modalSpecs.innerHTML = specs
      .filter(function (spec) {
        return spec[1];
      })
      .map(function (spec) {
        return `
          <div class="cl-modal__spec">
            <strong>${spec[0]}</strong>
            ${spec[1]}
          </div>
        `;
      })
      .join('');

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeDetails() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    activeModalCard = null;

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function makeProductCardsInteractive() {
    catalog.querySelectorAll('.cl-product-card').forEach(function (card) {
      const clickableElements = [
        card.querySelector('.cl-product-card__image'),
        card.querySelector('h3')
      ];

      clickableElements.forEach(function (element) {
        if (!element) return;
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute(
          'aria-label',
          'Bekijk details van ' + (card.dataset.productName || 'dit product')
        );
      });
    });
  }

  catalog.addEventListener('click', function (event) {
    const brandButton = event.target.closest('.cl-brand-card');
    const addButton = event.target.closest('.cl-add-product');
    const detailsButton = event.target.closest('.cl-open-details');
    const clickableProduct = event.target.closest(
      '.cl-product-card__image, .cl-product-card h3'
    );
    const removeButton = event.target.closest('.cl-summary__remove');

    if (brandButton) {
      showBrand(brandButton.dataset.brandTarget);
      return;
    }

    if (addButton) {
      const card = addButton.closest('.cl-product-card');
      const quantityInput = card.querySelector('input[type="number"]');
      addProduct(card, quantityInput ? quantityInput.value : 1);
      return;
    }

    if (detailsButton) {
      openDetails(detailsButton.closest('.cl-product-card'));
      return;
    }

    if (clickableProduct) {
      openDetails(clickableProduct.closest('.cl-product-card'));
      return;
    }

    if (removeButton) {
      delete selectedProducts[removeButton.dataset.key];
      renderSummary();
    }
  });

  catalog.addEventListener('keydown', function (event) {
    const clickableProduct = event.target.closest(
      '.cl-product-card__image, .cl-product-card h3'
    );

    if (
      clickableProduct &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      openDetails(clickableProduct.closest('.cl-product-card'));
    }
  });

  modalAddButton.addEventListener('click', function () {
    if (!activeModalCard) return;
    addProduct(activeModalCard, modalQuantity.value);
    closeDetails();
  });

  modalClose.addEventListener('click', closeDetails);

  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeDetails();
    }
  });

  modalContent.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;

    const focusable = modalContent.querySelectorAll(
      'button, input, [href], [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeDetails();
    }
  });

  makeProductCardsInteractive();
  renderSummary();
})();
