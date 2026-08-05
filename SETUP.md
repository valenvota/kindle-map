# Setup y flujo de trabajo entre computadoras

Guía para trabajar en KindleMap desde varias máquinas (por ejemplo una PC y una
Mac) sin perder trabajo. La fuente de verdad es siempre **GitHub**
(`github.com/valenvota/kindle-map`); cada compu tiene su copia local y se
sincroniza contra el repo.

---

## Regla de oro

> **Al empezar** en una compu → `git pull`.
> **Al terminar**, antes de cambiar de compu → commit + `git push`.

Mientras cierres cada sesión con push, saltás entre máquinas sin fricción. Si
editás en una máquina sin haber subido lo de la otra, git te va a pedir resolver
un conflicto: molesto pero no grave. El push al final lo evita.

---

## Setup de una máquina nueva (una sola vez)

### macOS

```bash
# 1. Herramientas de desarrollador (incluye git)
xcode-select --install

# 2. Homebrew (instalador de programas)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Node.js (trae npm)
brew install node

# 4. GitHub CLI + autenticación (para poder hacer push sin usuario/contraseña)
brew install gh
gh auth login          # GitHub.com → HTTPS → autenticar con el navegador

# 5. Claude Code
npm install -g @anthropic-ai/claude-code
```

### Traer el proyecto

```bash
cd ~/Developer          # o donde prefieras
git clone https://github.com/valenvota/kindle-map.git
cd kindle-map
npm ci                  # instala dependencias exactas del lockfile
npm run dev             # levanta el server; abrí la URL que imprime (ej. http://localhost:5173)
```

`node_modules/` NO viaja por git, por eso hace falta `npm ci` (o `npm install`)
después de clonar.

Para arrancar Claude Code: entrá a la carpeta y escribí `claude`.

---

## Flujo diario

```bash
cd kindle-map
git pull                # 1. bajás lo último ANTES de tocar nada

# ... trabajás / Claude trabaja ...

git add -A
git commit -m "..."     # 2. guardás
git push                # 3. subís antes de irte / cambiar de compu
```

Podés delegarle el cierre a Claude: *"guardá y subí antes de que cambie de
máquina"* y hace el commit + push.

### Verificar que dos máquinas están sincronizadas

```bash
git log -1 --oneline
```

Si el hash y el mensaje coinciden en ambas, tienen el mismo estado.

---

## Cosas que conviene saber

- **La memoria de Claude no viaja por GitHub.** Vive en `~/.claude/` de cada
  compu, no en el repo. Una sesión de Claude en una máquina nueva arranca sin el
  contexto de conversaciones previas. Para ponerla al día del proyecto, pedile
  al empezar: *"Leé `REDESIGN_PLAN.md` y decime en qué estamos."* Ese archivo y
  `DESIGN_SYSTEM.md` sí viajan por el repo.

- **Vercel deploya solo.** El deploy automático está atado al repo en GitHub, no
  a ninguna compu. Pushees desde donde pushees, Vercel agarra `main` y deploya.

- **No mezclar cambios sin pushear.** El único escenario que trae dolor es dejar
  trabajo sin subir en una máquina y editar en la otra. La regla de oro lo evita.
