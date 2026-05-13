(function () {
  const catalog = document.querySelector('#clAssortment');
  if (!catalog) return;

  const selectedProducts = {};
  const mailTo = 'bestellingen@example.com';
  const mailSubject = 'Bestelaanvraag Club Lions assortiment';

  const brandButtons = catalog.querySelectorAll('.cl-brand-card');
  const brandSections = catalog.querySelectorAll('.cl-products-section');

  const summaryList = catalog.querySelector('.cl-summary__list');
  const emptyText = catalog.querySelector('.cl-summary__empty');
  const mailButton = catalog.querySelector('.cl-summary__mail');

  const modal = catalog.querySelector('#clProductModal');
  const modalClose = catalog.querySelector('.cl-modal__close');
  const modalImage = catalog.querySelector('.cl-modal__image');
  const modalTitle = catalog.querySelector('.cl-modal__title');
  const modalDescription = catalog.querySelector('.cl-modal__description');
  const modalSpecs = catalog.querySelector('.cl-modal__specs');

  function showBrand(brand) {
    brandButtons.forEach(function (button) {
      button.classList.toggle(
        'is-active',
        button.dataset.brandTarget === brand
      );
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
      mailButton.href = '#';
      return;
    }

    emptyText.style.display = 'none';
    mailButton.style.opacity = '1';
    mailButton.style.pointerEvents = 'auto';

    products.forEach(function (product) {
      const item = document.createElement('li');

      item.innerHTML = `
        <img 
          class="cl-summary__image" 
          src="${product.image || 'https://via.placeholder.com/120x120?text=Geen+afbeelding'}" 
          alt="${product.name}"
        >

        <div>
          <div class="cl-summary__product-title">
            ${product.name}
          </div>

          <div class="cl-summary__product-meta">
            Merk: ${product.brand}<br>
            Formaat: ${product.format}<br>
            Aantal: ${product.quantity}
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
    const lines = [
      'Beste Customer Service,',
      '',
      'Graag ontvang ik onderstaande producten:',
      ''
    ];

    products.forEach(function (product) {
      lines.push(
        `- ${product.brand} - ${product.name} | Formaat: ${product.format} | Aantal: ${product.quantity}`
      );
    });

    lines.push('');
    lines.push('Naam:');
    lines.push('Bedrijf:');
    lines.push('Telefoonnummer:');
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
    const image = card.querySelector('.cl-product-card__image');

    modalImage.src = image ? image.src : '';
    modalImage.alt = card.dataset.productName || '';

    modalTitle.textContent =
      card.dataset.productName || '';

    modalDescription.textContent =
      card.dataset.description || '';

    const specs = [
      ['Merk', card.dataset.brand],
      ['Artikelnummer', card.dataset.productCode || ''],
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
  }

  function closeDetails() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  catalog.addEventListener('click', function (event) {
    const brandButton = event.target.closest('.cl-brand-card');
    const addButton = event.target.closest('.cl-add-product');
    const detailsButton = event.target.closest('.cl-open-details');
    const removeButton = event.target.closest('.cl-summary__remove');

    if (brandButton) {
      showBrand(brandButton.dataset.brandTarget);
    }

    if (addButton) {
      const card = addButton.closest('.cl-product-card');

      const quantityInput =
        card.querySelector('input[type="number"]');

      const quantity =
        parseInt(quantityInput.value, 10) || 1;

      const image =
        card.querySelector('.cl-product-card__image');

      const key = card.dataset.productName;

      selectedProducts[key] = {
        key: key,
        name: card.dataset.productName || '',
        code: card.dataset.productCode || '',
        brand: card.dataset.brand || '',
        format: card.dataset.format || '',
        quantity: quantity,
        image: image ? image.src : ''
      };

      renderSummary();
    }

    if (detailsButton) {
      openDetails(
        detailsButton.closest('.cl-product-card')
      );
    }

    if (removeButton) {
      delete selectedProducts[
        removeButton.dataset.key
      ];

      renderSummary();
    }
  });

  modalClose.addEventListener('click', closeDetails);

  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeDetails();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeDetails();
    }
  });

  renderSummary();
})();
