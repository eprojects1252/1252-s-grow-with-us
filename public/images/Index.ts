```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>08 Layered Card Navigation</title>
  <!-- Load Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Inter & Plus Jakarta Sans for clean modern UI typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
          },
        },
      },
    };
  </script>
  <style>
    body {
      background-color: #e6ebf5;
      background-image: radial-gradient(circle at 50% 25%, #eff3fb 0%, #e4e9f4 60%, #dce3f0 100%);
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Base subtle backing plate behind the cards */
    .nav-backdrop-plate {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%);
      box-shadow:
        0 14px 32px -12px rgba(130, 145, 175, 0.22),
        inset 0 1px 1px rgba(255, 255, 255, 0.7);
    }

    /* Card transition & base styling */
    .nav-card {
      transition:
        transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 0.42s cubic-bezier(0.22, 1, 0.36, 1),
        background 0.35s ease,
        border-color 0.35s ease;
      will-change: transform, box-shadow;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    /* Stacked sub-layers underneath each card */
    .card-stack-layer {
      transition:
        transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.35s ease,
        box-shadow 0.42s ease;
      pointer-events: none;
    }

    /* Iridescent cyan-to-pink glow on the active card */
    .active-card-surface {
      background: linear-gradient(135deg, rgba(244, 253, 255, 0.98) 0%, rgba(255, 255, 255, 0.99) 48%, rgba(255, 245, 249, 0.98) 100%);
      box-shadow:
        -10px 8px 24px -4px rgba(103, 232, 249, 0.34),
        10px 6px 24px -4px rgba(244, 114, 182, 0.28),
        0 18px 34px -10px rgba(71, 85, 105, 0.22),
        inset 0 0 0 1.5px rgba(255, 255, 255, 0.95);
    }

    /* Subtle iridescent gradient border ring for active card */
    .active-iridescent-ring {
      background: linear-gradient(135deg, rgba(125, 211, 252, 0.65), rgba(255, 255, 255, 0.9) 50%, rgba(249, 168, 212, 0.65));
    }

    /* Inactive card surface */
    .inactive-card-surface {
      background: linear-gradient(180deg, rgba(252, 253, 255, 0.94) 0%, rgba(246, 248, 253, 0.92) 100%);
      box-shadow:
        0 8px 20px -6px rgba(100, 116, 139, 0.14),
        0 2px 6px -1px rgba(100, 116, 139, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.95);
    }

    .inactive-card-surface:hover {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 251, 255, 0.96) 100%);
      box-shadow:
        0 12px 24px -6px rgba(100, 116, 139, 0.18),
        0 4px 10px -2px rgba(100, 116, 139, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 1);
    }

    /* Smooth preview panel fade/slide transition */
    @keyframes panelReveal {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.99);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .animate-panel {
      animation: panelReveal 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col items-center justify-center px-3 py-10 sm:px-6 text-slate-800 selection:bg-sky-200 selection:text-slate-900">
  <!-- Main Showcase Container -->
  <main class="w-full max-w-2xl flex flex-col items-center">
    
    <!-- Layered Card Navigation Wrapper -->
    <section aria-label="08 Layered Card Navigation" class="relative w-full flex flex-col items-center pt-4 pb-2">
      <!-- Subtle soft translucent housing pill behind the cards (matches reference top/side frame) -->
      <div
        class="nav-backdrop-plate relative flex items-center justify-center rounded-[28px] px-3 sm:px-5 pt-6 pb-8 sm:pt-7 sm:pb-9 border border-white/60 backdrop-blur-md"
      >
        <!-- Horizontal Overlapping Cards Track -->
        <div
          id="navTrack"
          role="tablist"
          aria-label="Primary Navigation"
          class="relative flex items-center justify-center"
        >
          <!-- Cards will be rendered & updated cleanly by JS -->
        </div>
      </div>

      <!-- Reference Title Caption ("08 Layered Card Navigation") -->
      <div class="mt-6 sm:mt-7 flex items-center justify-center gap-3 sm:gap-4 tracking-tight">
        <span class="text-2xl sm:text-4xl font-extrabold text-[#16181d] leading-none">08</span>
        <h1 class="text-lg sm:text-2xl font-semibold text-[#1e2128] leading-none">
          Layered Card Navigation
        </h1>
      </div>
    </section>

    <!-- Interactive Preview Card Below -->
    <section
      id="previewSection"
      aria-live="polite"
      class="w-full max-w-lg mt-8 sm:mt-10"
    >
      <!-- Dynamic content injected here -->
    </section>

  </main>

  <script>
    /**
     * Navigation items configuration matching the exact order, labels,
     * crisp SVG iconography, and interactive preview content.
     */
    const NAV_ITEMS = [
      {
        id: 'home',
        label: 'Home',
        badge: 'Overview',
        title: 'Welcome Back, Alex',
        subtitle: 'Your minimalist workspace and creative overview are ready.',
        stats: [
          { label: 'Active Streak', value: '14 Days' },
          { label: 'Focus Score', value: '94%' },
        ],
        accent: 'from-sky-400/20 to-indigo-400/20',
        icon: (strokeWidth) => `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300">
            <path d="M3 10.2L12 3l9 7.2V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20v-9.8Z" />
            <path d="M9.5 21.5v-6.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6.5" />
          </svg>
        `,
      },
      {
        id: 'projects',
        label: 'Projects',
        badge: '12 Active',
        title: 'Product & Design Systems',
        subtitle: 'Explore ongoing UI architecture, prototypes, and case studies.',
        stats: [
          { label: 'In Progress', value: '04' },
          { label: 'Shipped', value: '28' },
        ],
        accent: 'from-indigo-400/20 to-cyan-400/20',
        icon: (strokeWidth) => `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300">
            <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6a1.5 1.5 0 0 1 1.15.54l1.2 1.42A1.5 1.5 0 0 0 12.6 7.5h6.9A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-12Z" />
          </svg>
        `,
      },
      {
        id: 'portfolio',
        label: 'Portfolio',
        badge: 'Featured',
        title: 'Curated Digital Craft',
        subtitle: 'Selected works blending tactile depth, micro-interactions, and clean code.',
        stats: [
          { label: 'Case Studies', value: '16' },
          { label: 'Recognition', value: '07 Awards' },
        ],
        accent: 'from-cyan-400/25 via-white to-pink-400/25',
        icon: (strokeWidth) => `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300">
            <path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
            <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4" />
            <rect x="14.5" y="9.5" width="6.5" height="5" rx="1.5" />
            <circle cx="17.2" cy="12" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        `,
      },
      {
        id: 'connect',
        label: 'Connect',
        badge: 'Network',
        title: 'Collaborate & Share',
        subtitle: 'Direct channels for design partnerships, consulting, and social links.',
        stats: [
          { label: 'Response Time', value: '< 2 hrs' },
          { label: 'Availability', value: 'Open' },
        ],
        accent: 'from-pink-400/20 to-purple-400/20',
        icon: (strokeWidth) => `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300">
            <circle cx="17.5" cy="5.5" r="2.5" />
            <circle cx="6.5" cy="12" r="2.5" />
            <circle cx="17.5" cy="18.5" r="2.5" />
            <line x1="8.7" y1="10.7" x2="15.3" y2="6.8" />
            <line x1="8.7" y1="13.3" x2="15.3" y2="17.2" />
          </svg>
        `,
      },
      {
        id: 'store',
        label: 'Store',
        badge: 'UI Kits',
        title: 'Digital Assets & Templates',
        subtitle: 'Download layered Figma components, icon packs, and frontend starter kits.',
        stats: [
          { label: 'UI Packs', value: '09' },
          { label: 'Downloads', value: '4.2k+' },
        ],
        accent: 'from-rose-400/20 to-amber-300/20',
        icon: (strokeWidth) => `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300">
            <path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" />
            <path d="M3 9.5 4.6 4.8A1.2 1.2 0 0 1 5.75 4h12.5a1.2 1.2 0 0 1 1.15.8L21 9.5" />
            <path d="M3 9.5a2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0" />
            <path d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" />
          </svg>
        `,
      },
    ];

    // Default active card is index 2 ('Portfolio') matching the reference design
    let activeIndex = 2;

    const navTrack = document.getElementById('navTrack');
    const previewSection = document.getElementById('previewSection');

    /**
     * Renders all 5 overlapping cards with dynamic z-index stacking,
     * distance-based scale/elevation cascade, and stacked bottom card edges.
     */
    function renderNavigation() {
      navTrack.innerHTML = '';

      NAV_ITEMS.forEach((item, index) => {
        const isActive = index === activeIndex;
        const distance = Math.abs(index - activeIndex);

        // Z-index hierarchy: active card is highest (30), adjacent cards (20), outer cards (10)
        const zIndex = isActive ? 30 : distance === 1 ? 20 : 10;

        // Vertical & scale cascade matching the stepped pyramid silhouette in the reference image
        let transformStyle = '';
        if (isActive) {
          transformStyle = 'translateY(-6px) scale(1.13)';
        } else if (distance === 1) {
          transformStyle = 'translateY(1px) scale(1.0)';
        } else {
          transformStyle = 'translateY(6px) scale(0.91)';
        }

        // Overlap margin between cards so edges layer neatly over neighbors
        const overlapMargin = index === 0 ? '' : '-ml-1.5 sm:-ml-2.5';

        // Wrapper holds the main card + the subtle stacked paper/card edges underneath
        const cardWrapper = document.createElement('div');
        cardWrapper.className = `relative flex flex-col items-center ${overlapMargin}`;
        cardWrapper.style.zIndex = zIndex;

        // Stroke thickness & text weight change dynamically when active
        const strokeWidth = isActive ? '2.2' : '1.65';
        const textClasses = isActive
          ? 'font-bold text-[#14171f] tracking-tight'
          : 'font-medium text-[#525866] group-hover:text-[#232732]';
        const iconColor = isActive
          ? 'text-[#14171f]'
          : 'text-[#555b69] group-hover:text-[#232732]';

        // Stacked bottom layers (two subtle peeking card edges underneath)
        const bottomLayer1Class = isActive
          ? 'w-[86%] h-3 -bottom-2.5 bg-white/90 border border-white shadow-[0_6px_14px_rgba(100,116,139,0.16)] opacity-100'
          : 'w-[84%] h-2.5 -bottom-1.5 bg-white/75 border border-white/80 shadow-[0_4px_10px_rgba(100,116,139,0.1)] opacity-85';

        const bottomLayer2Class = isActive
          ? 'w-[74%] h-3 -bottom-4 bg-white/75 border border-white/80 shadow-[0_8px_16px_rgba(100,116,139,0.14)] opacity-95'
          : 'w-[72%] h-2.5 -bottom-2.5 bg-white/55 border border-white/60 shadow-[0_4px_8px_rgba(100,116,139,0.08)] opacity-70';

        cardWrapper.innerHTML = `
          <button
            type="button"
            role="tab"
            aria-selected="${isActive}"
            data-index="${index}"
            style="transform: ${transformStyle};"
            class="nav-card group relative flex flex-col items-center justify-center
                   w-[64px] h-[72px] sm:w-[92px] sm:h-[98px]
                   rounded-2xl sm:rounded-[20px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <!-- Iridescent outer border highlight for active state -->
            <span
              class="absolute inset-0 rounded-2xl sm:rounded-[20px] p-[1.5px] transition-opacity duration-300 ${
                isActive ? 'active-iridescent-ring opacity-100' : 'opacity-0'
              }"
            ></span>

            <!-- Main Card Face -->
            <span
              class="relative z-10 w-full h-full rounded-2xl sm:rounded-[20px] flex flex-col items-center justify-center gap-1.5 sm:gap-2 px-1 transition-all duration-300 ${
                isActive ? 'active-card-surface' : 'inactive-card-surface border border-white/90'
              }"
            >
              <!-- Icon -->
              <span class="${iconColor} flex items-center justify-center">
                ${item.icon(strokeWidth)}
              </span>

              <!-- Label -->
              <span class="text-[11px] sm:text-[13.5px] leading-none ${textClasses} transition-colors duration-200">
                ${item.label}
              </span>
            </span>

            <!-- Stacked Card Edge Layer 1 (Directly under main card) -->
            <span
              aria-hidden="true"
              class="card-stack-layer absolute rounded-b-xl sm:rounded-b-2xl z-[5] ${bottomLayer1Class}"
            ></span>

            <!-- Stacked Card Edge Layer 2 (Deepest peeking edge) -->
            <span
              aria-hidden="true"
              class="card-stack-layer absolute rounded-b-xl sm:rounded-b-2xl z-[1] ${bottomLayer2Class}"
            ></span>
          </button>
        `;

        const btn = cardWrapper.querySelector('button');
        btn.addEventListener('click', () => {
          if (activeIndex !== index) {
            activeIndex = index;
            renderNavigation();
            renderPreview();
          }
        });

        navTrack.appendChild(cardWrapper);
      });
    }

    /**
     * Updates the interactive preview card below the navigation bar
     * so users can experience real tab switching feedback.
     */
    function renderPreview() {
      const current = NAV_ITEMS[activeIndex];

      previewSection.innerHTML = `
        <div
          key="${current.id}"
          class="animate-panel relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 p-5 sm:p-6 shadow-[0_18px_40px_-15px_rgba(100,116,139,0.18)]"
        >
          <!-- Subtle ambient glow matching the active card aesthetic -->
          <div class="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br ${current.accent} blur-2xl"></div>
          <div class="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-gradient-to-tr from-sky-300/20 to-pink-300/20 blur-2xl"></div>

          <div class="relative flex items-start justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-white shadow-sm flex items-center justify-center text-slate-800">
                ${current.icon('2')}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    ${current.label}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900/5 text-slate-700 border border-slate-200/60">
                    ${current.badge}
                  </span>
                </div>
                <h2 class="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  ${current.title}
                </h2>
              </div>
            </div>
          </div>

          <p class="relative mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed">
            ${current.subtitle}
          </p>

          <div class="relative mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-3">
            ${current.stats
              .map(
                (stat) => `
              <div class="rounded-2xl bg-slate-50/80 border border-white px-3.5 py-2.5">
                <div class="text-[11px] font-medium text-slate-400">${stat.label}</div>
                <div class="text-sm sm:text-base font-bold text-slate-800 mt-0.5">${stat.value}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    // Keyboard arrow support for smooth accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        activeIndex = (activeIndex + 1) % NAV_ITEMS.length;
        renderNavigation();
        renderPreview();
      } else if (e.key === 'ArrowLeft') {
        activeIndex = (activeIndex - 1 + NAV_ITEMS.length) % NAV_ITEMS.length;
        renderNavigation();
        renderPreview();
      }
    });

    // Initialize UI
    renderNavigation();
    renderPreview();
  </script>
</body>
</html>
```
