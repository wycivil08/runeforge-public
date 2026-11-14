'use strict';
const dialog = document.querySelector('#art-dialog');
const enlarged = document.querySelector('#dialog-image');
const error = document.querySelector('#dialog-error');
let opener = null;
for (const img of document.querySelectorAll('.art img')) {
  const figure = img.closest('figure');
  const settle = () => {
    const failed = img.naturalWidth === 0;
    figure.classList.toggle('failed', failed);
    figure.classList.toggle('loaded', !failed);
    figure.querySelector('.image-error').hidden = !failed;
  };
  img.addEventListener('load', settle);
  img.addEventListener('error', settle);
  if (img.complete) settle();
}
for (const link of document.querySelectorAll('.zoom-link')) {
  link.addEventListener('click', event => {
    if (!dialog.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    document.querySelector('#art-title').textContent = link.dataset.title;
    document.querySelector('#dialog-original').href = link.getAttribute('href');
    enlarged.alt = link.dataset.title;
    enlarged.hidden = false;
    error.hidden = true;
    enlarged.src = link.getAttribute('href');
    dialog.showModal();
  });
}
enlarged.addEventListener('error', () => { enlarged.hidden = true; error.hidden = false; });
dialog.addEventListener('close', () => { enlarged.removeAttribute('src'); if (opener) opener.focus(); });
