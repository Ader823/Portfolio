// Toggle Burger Menu
export const setupBurger = () => {
  let burgerIcon = document.querySelector("#burger");
  let navbarMenu = document.querySelector("#nav-links");
  burgerIcon.addEventListener('click', () => {
    navbarMenu.classList.toggle('is-active');
  })
}