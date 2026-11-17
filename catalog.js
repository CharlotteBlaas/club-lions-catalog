(function () {
  const catalog = document.querySelector('#clAssortment');

  if (!catalog) {
    return;
  }

  const selectedProducts = Object.create(null);
  const isFrenchPage = catalog.lang === 'fr-BE';

  const hmcCategories = ['hmc-benl', 'hmc-befr'];
  const mrcCategories = ['shortfiller-benl', 'shortfiller-befr', 'pijptabak-benl', 'pijptabak-befr'];
  const categoriesByAssortment = new Map([
    ['hmc', hmcCategories],
    ['alleen hmc', hmcCategories],
    ['mrc', mrcCategories],
    ['alleen mrc + pipe', mrcCategories],
    ['alle categorieen', [
      'hmc-benl', 'hmc-befr', 'shortfiller-benl', 'shortfiller-befr',
      'pijptabak-benl', 'pijptabak-befr'
    ]]
  ]);

  const assortmentNavigation = catalog.querySelector('.cl-assortment__categories');
  const categoryButtons = catalog.querySelectorAll('[data-assortment-target]');
  const assortmentStatus = catalog.querySelector('.cl-assortment__status');
  const brandGrid = catalog.querySelector('.cl-brand-grid');
  const summary = catalog.querySelector('.cl-summary');

  /*
   * Vul het definitieve adres van Customer Service in voordat de mailknop wordt gebruikt.
   */
  const mailTo = '';

  const baseMailSubject = isFrenchPage ? 'Demande de commande Club Lions' : 'Bestelaanvraag Club Lions';

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
   * Klantgegevens worden pas opgehaald wanneer
   * de e-maillink wordt opgebouwd.
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
    return card.dataset.productCode;
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

  function getAllowedCategories() {
    const assortment = getPlaceholderValue('.cl-customer-data__assortment')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s*\+\s*/g, ' + ')
      .replace(/\s+/g, ' ');

    return categoriesByAssortment.get(assortment) || [];
  }

  const permittedCategories = getAllowedCategories();
  const allowedCategories = Array.from(categoryButtons, button => button.dataset.assortmentTarget)
    .filter(category => permittedCategories.includes(category));

  function showBrand(brand) {
    brandButtons.forEach(function (button) {
      const isActive = !button.hidden && button.dataset.brandTarget === brand;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    brandSections.forEach(function (section) {
      const isActive = section.dataset.brandSection === brand;
      section.hidden = !isActive;
      section.classList.toggle('is-active', isActive);
    });
  }

  function showCategory(category) {
    if (!allowedCategories.includes(category)) {
      return;
    }

    categoryButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.assortmentTarget === category));
    });

    const availableBrands = new Set();

    brandSections.forEach(function (section) {
      section.querySelectorAll('.cl-product-card').forEach(function (card) {
        const tabs = card.dataset.assortmentTabs || '';
        card.hidden = !tabs.split(/\s+/).includes(category);
        if (!card.hidden) {
          availableBrands.add(section.dataset.brandSection);
        }
      });
    });

    brandButtons.forEach(function (button) {
      button.hidden = !availableBrands.has(button.dataset.brandTarget);
    });

    const firstBrand = Array.from(brandButtons).find(function (button) {
      return !button.hidden;
    });
    showBrand(firstBrand ? firstBrand.dataset.brandTarget : '');
    brandGrid.hidden = !firstBrand;
    assortmentStatus.hidden = Boolean(firstBrand);
    if (!firstBrand) {
      assortmentStatus.textContent = isFrenchPage
        ? 'Cette catégorie ne contient actuellement aucun produit.'
        : 'Er staan momenteel geen producten in dit tabblad.';
    }
    summary.hidden = !firstBrand && !Object.keys(selectedProducts).length;
  }

  function addProductFromCard(card, quantity) {
    if (!card || card.hidden) {
      return;
    }

    const key = [
      card.dataset.brand || '',
      card.dataset.mailName || card.dataset.productName || '',
      getProductCode(card)
    ].join('::');

    selectedProducts[key] = {
      key: key,
      name: card.dataset.productName || '',
      mailName: card.dataset.mailName || card.dataset.productName || '',
      packSize: card.dataset.packSize,
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

    summary.hidden = brandGrid.hidden && products.length === 0;
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
            ${isFrenchPage ? 'Aucune image' : 'Geen afbeelding'}
          </div>
        `;

      item.innerHTML = `
        ${imageHtml}

        <div>
          <div class="cl-summary__product-title">
            ${safeName}
          </div>

          <div class="cl-summary__product-meta">
            ${isFrenchPage ? 'Référence' : 'Artikelnummer'}: ${safeCode}<br>
            ${isFrenchPage ? 'Marque' : 'Merk'}: ${safeBrand}<br>
            ${safeFormat ? `${isFrenchPage ? 'Format' : 'Formaat'}: ${safeFormat}<br>` : ''}
            ${isFrenchPage ? 'Quantité à commander' : 'Aantal besteleenheden'}: ${product.quantity}<br>
            ${isFrenchPage ? 'Pièces par unité de commande' : 'Stuks per besteleenheid'}: ${escapeHtml(product.packSize)}
          </div>
        </div>

        <button
          type="button"
          class="cl-summary__remove"
          data-key="${escapeHtml(product.key)}"
          aria-label="${isFrenchPage ? `Supprimer ${safeName}` : `${safeName} verwijderen`}"
        >
          ${isFrenchPage ? 'Supprimer' : 'Verwijderen'}
        </button>
      `;

      summaryList.appendChild(item);
    });

    if (!mailTo) {
      mailButton.href = '#';
      mailButton.setAttribute('aria-disabled', 'true');
      mailButton.style.pointerEvents = 'none';
      mailButton.style.opacity = '0.5';
      return;
    }

    updateMailLink(products);
  }

  function updateMailLink(products) {
    const customer = getCustomerData();

    /*
     * Onderwerp opbouwen:
     * Bestelaanvraag Club Lions - klantnummer - bedrijfsnaam
     */
    const subjectParts = [
      baseMailSubject,
      customer.number,
      customer.company
    ].filter(Boolean);

    const mailSubject =
      subjectParts.join(' - ');

    const lines = [
      isFrenchPage ? 'Bonjour,' : 'Beste Customer Service,',
      '',
      isFrenchPage ? 'Je souhaite recevoir les produits suivants :' : 'Graag ontvang ik onderstaande producten:',
      ''
    ];

    products.forEach(function (product) {
      const unit = isFrenchPage
        ? (product.quantity === 1 ? 'unité de commande' : 'unités de commande')
        : (product.quantity === 1 ? 'besteleenheid' : 'besteleenheden');
      const pieces = isFrenchPage ? 'pièces par unité de commande' : 'stuks per besteleenheid';
      const name = isFrenchPage ? product.name : product.mailName;
      lines.push(
        `${product.code} - ${product.brand} ${name} - ${product.quantity} ${unit} (${product.packSize} ${pieces})`
      );
    });

    lines.push('', isFrenchPage ? 'Coordonnées :' : 'Klantgegevens:');
    const unavailable = isFrenchPage ? 'Non renseigné' : 'Niet automatisch beschikbaar';
    const fields = [
      [isFrenchPage ? 'Numéro client' : 'Klantnummer', customer.number],
      [isFrenchPage ? 'Nom' : 'Naam', customer.name],
      [isFrenchPage ? 'Entreprise' : 'Bedrijf', customer.company],
      [isFrenchPage ? 'Téléphone' : 'Telefoonnummer', customer.phone]
    ];
    fields.forEach(function ([label, value]) {
      lines.push(`${label}: ${value || unavailable}`);
    });

    lines.push('', isFrenchPage ? 'Cordialement,' : 'Met vriendelijke groet,');
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

  function openDetails(card) {
    if (!modal || !card || card.hidden) {
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
          (card.lang === 'fr-BE' ? 'Aucune image' : 'Geen afbeelding');

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

    const french = card.lang === 'fr-BE';
    const hmc = card.dataset.assortmentTabs.startsWith('hmc-');
    const price = new Intl.NumberFormat(card.lang, {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(card.dataset.price));

    modal.lang = card.lang;
    const specs = [
      [french ? 'Marque' : 'Merk', card.dataset.brand],
      [french ? 'Référence' : 'Artikelnummer', getProductCode(card)],
      [french ? 'Format' : 'Sigarenformaat', card.dataset.format],
      [french ? 'Origine' : 'Herkomst', card.dataset.origin],
      [
        hmc
          ? (french ? 'Prix par cigare' : 'Prijs per sigaar')
          : (french ? 'Prix par unité' : 'Prijs per eenheid'),
        price
      ],
      [
        hmc
          ? (french ? 'Cigares par unité de commande' : 'Sigaren per besteleenheid')
          : (french ? 'Pièces par unité de commande' : 'Stuks per besteleenheid'),
        card.dataset.packSize
      ],
      [french ? 'Cape' : 'Type dekblad', card.dataset.wrapper],
      [french ? 'Sous-cape' : 'Omblad', card.dataset.binder],
      [french ? 'Tripe' : 'Binnengoed', card.dataset.filler],
      [french ? 'Coupe' : 'Snede', card.dataset.cut],
      [french ? 'Profil aromatique' : 'Smaakprofiel', card.dataset.flavour],
      [french ? 'Intensité' : 'Sterkte', card.dataset.strength]
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

    const quantityLabel = french ? 'Quantité à commander' : 'Aantal besteleenheden';
    const modalQuantity = modal.querySelector('.cl-modal__quantity');
    modalQuantity.value = getCardQuantity(card);
    modalQuantity.setAttribute('aria-label', quantityLabel + ' – ' + card.dataset.productName);
    modal.querySelector('.cl-modal__quantity-label-text').textContent = quantityLabel;
    const packSize = Number(card.dataset.packSize);
    const packUnit = hmc
      ? (french ? 'cigare' : 'sigaar')
      : (french ? 'pièce' : 'stuk');
    const packPlural = hmc
      ? (french ? 'cigares' : 'sigaren')
      : (french ? 'pièces' : 'stuks');
    const packText = packSize + ' ' + (packSize === 1 ? packUnit : packPlural);
    modal.querySelector('.cl-modal__quantity-note').textContent = french
      ? `1 unité de commande = ${packText}`
      : `1 besteleenheid = ${packText}`;
    modal.querySelector('.cl-modal__add').textContent = french ? 'Ajouter à la demande' : 'Toevoegen aan aanvraag';
    modalClose.setAttribute('aria-label', french ? 'Fermer les détails' : 'Details sluiten');

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
      const categoryButton = event.target.closest('[data-assortment-target]');
      if (categoryButton) {
        showCategory(categoryButton.dataset.assortmentTarget);
        return;
      }

      if (event.target.closest('.cl-summary__mail[aria-disabled="true"]')) {
        event.preventDefault();
        return;
      }

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

      if (brandButton && !brandButton.hidden) {
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
            card.lang === 'fr-BE' ? `Voir les détails de ${productName}` : `Bekijk details van ${productName}`
          );
        }
      );

    });

  categoryButtons.forEach(function (button) {
    button.hidden = !allowedCategories.includes(button.dataset.assortmentTarget);
  });

  if (allowedCategories.length) {
    assortmentNavigation.hidden = false;
    showCategory(allowedCategories[0]);
  }

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
