
    document.addEventListener('DOMContentLoaded', () => {
      const wrapper = document.getElementById('wrapper');
      const logo = document.getElementById('logo');

      const iniciar = () => {
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        const menor = Math.min(sw, sh);

        const isMobile =
          sw < 650 ||
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Pega o tamanho real da imagem
        const naturalW = logo.naturalWidth || 400;

        // Aqui aumentamos MUITO no celular
        let finalScale = (menor * 1.7) / naturalW;

        if (isMobile) {
          finalScale = (menor * 2.4) / naturalW;   // TELONA
        }

        // Limites muito maiores agora
        const MAX_SCALE = isMobile ? 90 : 60;
        finalScale = Math.min(finalScale, MAX_SCALE);

        document.documentElement.style.setProperty('--final-scale', finalScale);

        // Começar animação
        setTimeout(() => wrapper.classList.add('expand'), 300);

        const growTime = 5500;
        const exitDelay = 1800;

        setTimeout(() => wrapper.classList.add('fade-out'), growTime);
        setTimeout(() => window.location.href = "login.html", growTime + exitDelay);
      };

      if (logo.complete) iniciar();
      else logo.onload = iniciar;
    });
 