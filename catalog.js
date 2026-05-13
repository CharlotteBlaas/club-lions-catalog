(function () {
  const catalog = document.querySelector('#clCatalogPage');
  if (!catalog) return;

  const selectedProducts = {};
  const summaryList = catalog.querySelector('.cl-catalog-summary__list');
  const emptyText = catalog.querySelector('.cl-catalog-summary__empty');
  const mailButton = catalog.querySelector('#clCatalogMailButton');

  const mailTo = 'bestellingen@example.com';
  const mailSubject = 'Bestelaanvraag Club Lions catalogus';

  function renderSummary() {
    summaryList.innerHTML = '';

    const products = Object.values(selectedProducts);

    if (products.length === 0) {
      emptyText.style.display = 'block';
      mailButton.style.pointerEvents = 'none';
      mailButton.style.opacity = '0.5';
      mailButton.href = '#';
      return;
    }

    emptyText.style.display = 'none';
    mailButton.style.pointerEvents = 'auto';
    mailButton.style.opacity = '1';

    products.forEach(function (product) {
      const li = document.createElement('li');

      li.innerHTML = `
        <span>
          <strong>${product.name}</strong><br>
          Artikelcode: ${product.code}<br>
          Aantal: ${product.quantity}
        </span>
        <button type="button" class="cl-catalog-summary__remove" data-code="${product.code}">
          Verwijderen
        </button>
      `;

      summaryList.appendChild(li);
    });

    updateMailLink(products);
  }

  function updateMailLink(products) {
    const lines = [
      'Beste,',
      '',
      'Graag ontvang ik onderstaande artikelen:',
      ''
    ];

    products.forEach(function (product) {
      lines.push(`- ${product.name} | Artikelcode: ${product.code} | Aantal: ${product.quantity}`);
    });

    lines.push('');
    lines.push('Naam:');
    lines.push('Bedrijf:');
    lines.push('Telefoonnummer:');
    lines.push('');
    lines.push('Met vriendelijke groet,');

    const body = encodeURIComponent(lines.join('\n'));
    const subject = encodeURIComponent(mailSubject);

    mailButton.href = `mailto:${mailTo}?subject=${subject}&body=${body}`;
  }

  catalog.addEventListener('click', function (event) {
    const addButton = event.target.closest('.cl-catalog-card__button');
    const removeButton = event.target.closest('.cl-catalog-summary__remove');

    if (addButton) {
      const card = addButton.closest('.cl-catalog-card');
      const input = card.querySelector('input[type="number"]');

      const name = card.dataset.productName;
      const code = card.dataset.productCode;
      const quantity = parseInt(input.value, 10) || 1;

      selectedProducts[code] = {
        name: name,
        code: code,
        quantity: quantity
      };

      renderSummary();
    }

    if (removeButton) {
      const code = removeButton.dataset.code;
      delete selectedProducts[code];
      renderSummary();
    }
  });

  renderSummary();
})();
