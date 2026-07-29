(function () {
  const catalog = document.querySelector('#clAssortment');

  if (!catalog) {
    return;
  }

  const selectedProducts = {};

  /*
   * PAS DIT E-MAILADRES AAN
   */
  const mailTo = 'bestellingen@example.com';

  const mailSubject = 'Bestelaanvraag Club Lions assortiment';

  const brandButtons =
    catalog.querySelectorAll('.cl-brand-card');

  const brandSections =
    catalog.querySelectorAll('.cl-products-section');

  const summaryList =
    catalog.querySelector('.cl-summary__list');

  const emptyText =
    catalog.querySelector('.cl-summary__empty');

  const mailButton =
    catalog.querySelector('.cl-summary__mail');

  const modal =
    catalog.querySelector('#clProductModal');

  const modalClose =
    catalog.querySelector('.cl-modal__close');

  const modalImage =
    catalog.querySelector('.cl-modal__image');

  const modalTitle =
    catalog.querySelector('.cl-modal__title');

  const modalDescription =
    catalog.querySelector('.cl-modal__description');

  const modalSpecs =
    catalog.querySelector('.cl-modal__specs');

  let activeModalCard = null;
  let lastFocusedElement = null;

  /*
   * Leest een Sparco-placeholder uit de HTML.
   *
   * Wanneer de placeholder nog niet vervangen is,
   * wordt een lege waarde teruggegeven.
   */
  function getPlaceholderValue(selector) {
    const element = catalog.querySelector(selector);

    if (!element) {
      return '';
    }

    const value = element.textContent
      .replace(/\u00a0/g, ' ')
      .trim();

    if (
      !value ||
      value.includes('{User.') ||
      value.toLowerCase() === 'null' ||
      value.toLowerCase() === 'undefined'
    ) {
      return '';
    }

    return value;
  }

  /*
   * De klantgegevens worden pas gelezen wanneer
   * de e-maillink wordt opgebouwd.
   *
   * Daardoor krijgt Sparco voldoende tijd om de
   * placeholders in de pagina te vervangen.
   */
  function getCustomerData() {
    const firstName = getPlaceholderValue(
      '.cl-customer-data__first-name'
    );

    const lastName = getPlaceholderValue(
      '.cl-customer-data__last-name'
    );

    return {
      number: getPlaceholderValue(
        '.cl-customer-data__number'
      ),

      name: [firstName, lastName]
        .filter(Boolean)
        .join(' '),

      company: getPlaceholderValue(
        '.cl-customer-data__company'
      ),

      phone: getPlaceholderValue(
        '.cl-customer-data__phone'
      )
    };
  }

  function getProductCode(card) {
    const code =
      (card.dataset.productCode || '').trim();

    return code || 'XXXXXXX';
  }

  function getCardImage(card) {
    const image = card.querySelector(
      'img.cl-product-card__image'
    );

    return image ? image.src : '';
  }

  function getCardQuantity(card) {
    const quantityInput = card.querySelector(
      'input[type="number"]'
    );

    const quantity = parseInt(
      quantityInput ? quantityInput.value : '1',
      10
    );

    return Math.max(1, quantity || 1);
  }

  function showBrand(brand) {
    brandButtons.forEach(function (button) {
      const isActive =
        button.dataset.brandTarget === brand;

      button.classList.toggle(
        'is-active',
        isActive
      );

      button.setAttribute(
        'aria-pressed',
        String(isActive)
      );
    });

    brandSections.forEach(function (section) {
      section.classList.toggle(
        'is-active',
        section.dataset.brandSection === brand
      );
    });
  }

  function addProductFromCard(card, quantity) {
    if (!card) {
      return;
    }

    const key = [
      card.dataset.brand || '',
      card.dataset.productName || ''
    ].join('::');

    selectedProducts[key] = {
      key: key,
      name: card.dataset.productName || '',
      code: getProductCode(card),
      brand: card.dataset.brand || '',
      format: card.dataset.format || '',
      quantity: Math.max(
        1,
        parseInt(quantity, 10) || 1
      ),
      image: getCardImage(card)
    };

    renderSummary();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderSummary() {
    if (
      !summaryList ||
      !emptyText ||
      !mailButton
    ) {
      return;
    }

    const products =
      Object.values(selectedProducts);

    summaryList.innerHTML = '';

    if (!products.length) {
      emptyText.style.display = 'block';

      mailButton.style.opacity = '0.5';
      mailButton.style.pointerEvents = 'none';

      mailButton.setAttribute(
        'aria-disabled',
        'true'
      );

      mailButton.href = '#';

      return;
    }

    emptyText.style.display = 'none';

    mailButton.style.opacity = '1';
    mailButton.style.pointerEvents = 'auto';

    mailButton.removeAttribute(
      'aria-disabled'
    );

    products.forEach(function (product) {
      const item = document.createElement('li');

      const safeName =
        escapeHtml(product.name);

      const safeCode =
        escapeHtml(product.code);

      const safeBrand =
        escapeHtml(product.brand);

      const safeFormat =
        escapeHtml(product.format);

      const imageHtml = product.image
        ? `
          <img
            class="cl-summary__image"
            src="${escapeHtml(product.image)}"
            alt="${safeName}"
          >
        `
        : `
          <div
            class="cl-summary__image-placeholder"
            aria-hidden="true"
          >
            Geen afbeelding
          </div>
        `;

      item.innerHTML = `
        ${imageHtml}

        <div>
          <div class="cl-summary__product-title">
            ${safeName}
          </div>

          <div class="cl-summary__product-meta">
            Artikelnummer: ${safeCode}<br>
            Merk: ${safeBrand}<br>
            Formaat: ${safeFormat}<br>
            Aantal kisten: ${product.quantity}
          </div>
        </div>

        <button
          type="button"
          class="cl-summary__remove"
          data-key="${escapeHtml(product.key)}"
          aria-label="${safeName} verwijderen"
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

    lines.push(
      `Klantnummer: ${
        customer.number ||
        'Niet automatisch beschikbaar'
      }`
    );

    lines.push(
      `Naam: ${
        customer.name ||
        'Niet automatisch beschikbaar'
      }`
    );

    lines.push(
      `Bedrijf: ${
        customer.company ||
        'Niet automatisch beschikbaar'
      }`
    );

    lines.push(
      `Telefoonnummer: ${
        customer.phone ||
        'Niet automatisch beschikbaar'
      }`
    );

    lines.push('');
    lines.push('Met vriendelijke groet,');

    if (customer.name) {
      lines.push(customer.name);
    }

    mailButton.href =
      'mailto:' +
      encodeURIComponent(mailTo) +
      '?subject=' +
      encodeURIComponent(mailSubject) +
      '&body=' +
      encodeURIComponent(
        lines.join('\n')
      );
  }

  function ensureModalOrderControls() {
    if (!modal || !modalSpecs) {
      return null;
    }

    let controls = modal.querySelector(
      '.cl-modal__order'
    );

    if (!controls) {
      controls = document.createElement('div');

      controls.className =
        'cl-modal__order';

      controls.innerHTML = `
        <label class="cl-modal__quantity-label">
          Aantal kisten

          <input
            class="cl-modal__quantity"
            type="number"
            min="1"
            value="1"
            inputmode="numeric"
          >
        </label>

        <small class="cl-modal__quantity-note">
          Een aantal van 1 staat voor 1 complete kist.
        </small>

        <button
          class="cl-btn cl-modal__add"
          type="button"
        >
          Toevoegen aan aanvraag
        </button>
      `;

      modalSpecs.insertAdjacentElement(
        'afterend',
        controls
      );
    }

    return controls;
  }

  function openDetails(card) {
    if (!modal || !card) {
      return;
    }

    activeModalCard = card;
    lastFocusedElement =
      document.activeElement;

    const image = card.querySelector(
      'img.cl-product-card__image'
    );

    const imagePlaceholder =
      modal.querySelector(
        '.cl-modal__image-placeholder'
      );

    if (image && modalImage) {
      modalImage.src = image.src;

      modalImage.alt =
        card.dataset.productName || '';

      modalImage.style.display = '';

      if (imagePlaceholder) {
        imagePlaceholder.style.display =
          'none';
      }
    } else {
      if (modalImage) {
        modalImage.removeAttribute('src');
        modalImage.alt = '';
        modalImage.style.display = 'none';
      }

      if (imagePlaceholder) {
        imagePlaceholder.textContent =
          card.dataset.brand ||
          'Geen afbeelding';

        imagePlaceholder.style.display =
          'flex';
      }
    }

    if (modalTitle) {
      modalTitle.textContent =
        card.dataset.productName || '';
    }

    if (modalDescription) {
      modalDescription.textContent =
        card.dataset.description || '';
    }

    const specs = [
      ['Merk', card.dataset.brand],

      [
        'Artikelnummer',
        getProductCode(card)
      ],

      [
        'Sigarenformaat',
        card.dataset.format
      ],

      [
        'Besteleenheid',
        'Per complete kist'
      ],

      ['Herkomst', card.dataset.origin],

      [
        'Type dekblad',
        card.dataset.wrapper
      ],

      ['Omblad', card.dataset.binder],

      [
        'Binnengoed',
        card.dataset.filler
      ],

      [
        'Smaakprofiel',
        card.dataset.flavour
      ],

      [
        'Smaakbeleving',
        card.dataset.strength
      ]
    ];

    if (modalSpecs) {
      modalSpecs.innerHTML = specs
        .filter(function (spec) {
          return spec[1];
        })
        .map(function (spec) {
          return `
            <div class="cl-modal__spec">
              <strong>
                ${escapeHtml(spec[0])}
              </strong>

              ${escapeHtml(spec[1])}
            </div>
          `;
        })
        .join('');
    }

    const controls =
      ensureModalOrderControls();

    const modalQuantity = controls
      ? controls.querySelector(
          '.cl-modal__quantity'
        )
      : null;

    if (modalQuantity) {
      modalQuantity.value =
        getCardQuantity(card);

      modalQuantity.setAttribute(
        'aria-label',
        `Aantal kisten ${
          card.dataset.productName ||
          'product'
        }`
      );
    }

    modal.classList.add('is-open');

    modal.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.style.overflow =
      'hidden';

    if (modalClose) {
      window.setTimeout(function () {
        modalClose.focus();
      }, 0);
    }
  }

  function closeDetails() {
    if (
      !modal ||
      !modal.classList.contains('is-open')
    ) {
      return;
    }

    modal.classList.remove('is-open');

    modal.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.style.overflow = '';

    activeModalCard = null;

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus ===
        'function'
    ) {
      lastFocusedElement.focus();
    }
  }

  catalog.addEventListener(
    'click',
    function (event) {
      const brandButton =
        event.target.closest(
          '.cl-brand-card'
        );

      const addButton =
        event.target.closest(
          '.cl-add-product'
        );

      const detailsButton =
        event.target.closest(
          '.cl-open-details'
        );

      const productImage =
        event.target.closest(
          '.cl-product-card__image'
        );

      const productTitle =
        event.target.closest(
          '.cl-product-card h3'
        );

      const removeButton =
        event.target.closest(
          '.cl-summary__remove'
        );

      const modalAddButton =
        event.target.closest(
          '.cl-modal__add'
        );

      if (brandButton) {
        showBrand(
          brandButton.dataset.brandTarget
        );

        return;
      }

      if (addButton) {
        const card = addButton.closest(
          '.cl-product-card'
        );

        addProductFromCard(
          card,
          getCardQuantity(card)
        );

        return;
      }

      if (
        detailsButton ||
        productImage ||
        productTitle
      ) {
        const clickedElement =
          detailsButton ||
          productImage ||
          productTitle;

        const card = clickedElement.closest(
          '.cl-product-card'
        );

        if (card) {
          openDetails(card);
        }

        return;
      }

      if (removeButton) {
        delete selectedProducts[
          removeButton.dataset.key
        ];

        renderSummary();

        return;
      }

      if (
        modalAddButton &&
        activeModalCard
      ) {
        const modalQuantity =
          modal.querySelector(
            '.cl-modal__quantity'
          );

        const quantity =
          modalQuantity
            ? modalQuantity.value
            : 1;

        addProductFromCard(
          activeModalCard,
          quantity
        );

        const cardQuantity =
          activeModalCard.querySelector(
            'input[type="number"]'
          );

        if (cardQuantity) {
          cardQuantity.value = Math.max(
            1,
            parseInt(quantity, 10) || 1
          );
        }

        closeDetails();
      }
    }
  );

  catalog.addEventListener(
    'keydown',
    function (event) {
      const productImage =
        event.target.closest(
          '.cl-product-card__image'
        );

      const productTitle =
        event.target.closest(
          '.cl-product-card h3'
        );

      if (
        (productImage || productTitle) &&
        (
          event.key === 'Enter' ||
          event.key === ' '
        )
      ) {
        event.preventDefault();

        const card =
          event.target.closest(
            '.cl-product-card'
          );

        if (card) {
          openDetails(card);
        }
      }
    }
  );

  /*
   * Maakt afbeeldingen en producttitels
   * ook via het toetsenbord klikbaar.
   */
  catalog
    .querySelectorAll(
      '.cl-product-card'
    )
    .forEach(function (card) {
      const image = card.querySelector(
        '.cl-product-card__image'
      );

      const title =
        card.querySelector('h3');

      const productName =
        card.dataset.productName ||
        'product';

      [image, title].forEach(
        function (element) {
          if (!element) {
            return;
          }

          element.setAttribute(
            'role',
            'button'
          );

          element.setAttribute(
            'tabindex',
            '0'
          );

          element.setAttribute(
            'aria-label',
            `Bekijk details van ${productName}`
          );
        }
      );

      if (!card.dataset.productCode) {
        card.dataset.productCode =
          'XXXXXXX';
      }
    });

  brandButtons.forEach(
    function (button) {
      button.setAttribute(
        'aria-pressed',
        button.classList.contains(
          'is-active'
        )
          ? 'true'
          : 'false'
      );
    }
  );

  if (modalClose) {
    modalClose.addEventListener(
      'click',
      closeDetails
    );
  }

  if (modal) {
    modal.setAttribute(
      'aria-hidden',
      'true'
    );

    modal.addEventListener(
      'click',
      function (event) {
        if (event.target === modal) {
          closeDetails();
        }
      }
    );
  }

  document.addEventListener(
    'keydown',
    function (event) {
      if (event.key === 'Escape') {
        closeDetails();
      }
    }
  );

  renderSummary();
})();
