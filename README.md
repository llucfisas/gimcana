# 🎮 Gimcana — Enginyeria de Dades

Aplicació web per gestionar una gimcana per equips amb rànquing en temps real.

## 📋 Funcionalitats

- **10 equips**, cadascun amb un camí únic per **9 proves** (a–i), totes acabant amb la prova final "i"
- **Fotos de localització**: cada prova té una foto que indica on han d'anar els participants
- **Rànquing en temps real** via Socket.io
- **Panell d'admin** amb controls de joc, monitorització i edició de proves
- **Validació flexible** de respostes (case-insensitive, sense accents)
- **Persistència d'estat** en fitxer JSON (sobreviu reinicis)

## 🚀 Desplegament a Render.com (GRATIS)

### Pas 1: Puja el codi a GitHub

1. Crea un repositori nou a [github.com](https://github.com/new) (pot ser privat)
2. Puja tots els fitxers d'aquesta carpeta al repositori:
   ```bash
   git init
   git add .
   git commit -m "Gimcana app"
   git branch -M main
   git remote add origin https://github.com/EL-TEU-USUARI/gimcana.git
   git push -u origin main
   ```

### Pas 2: Desplega a Render

1. Ves a [render.com](https://render.com) i crea un compte (pots usar GitHub)
2. Clica **"New +"** → **"Web Service"**
3. Connecta el teu repositori de GitHub
4. Configura:
   - **Name**: `gimcana` (o el que vulguis)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. *(Opcional)* A "Environment Variables" afegeix:
   - `ADMIN_PASSWORD` = la contrasenya que vulguis per l'admin (per defecte: `gimcana2026`)
6. Clica **"Deploy"** — en 2 minuts tindràs el teu URL!

### Pas 3: Comparteix

- Genera un **codi QR** del teu URL (p.ex. a [qr-code-generator.com](https://www.qr-code-generator.com))
- Comparteix-lo amb els participants

## 🔗 URLs de l'aplicació

| Pàgina | URL | Descripció |
|--------|-----|------------|
| Participants | `https://EL-TEU-URL.onrender.com` | Vista principal per als equips |
| Admin | `https://EL-TEU-URL.onrender.com/admin.html` | Panell de control |
| Rànquing | `https://EL-TEU-URL.onrender.com/ranking.html` | Per projectar en pantalla |

## ⚙️ Configuració de les proves

### Opció A: Des del panell d'admin (recomanat)
1. Obre `/admin.html` i entra amb la contrasenya
2. A la secció "Configuració de proves":
   - **Fotos**: Clica a la miniatura de cada prova per pujar una foto
   - **Preguntes**: Clica "Editar" per canviar pregunta, respostes i pista

### Opció B: Editant el codi
Edita l'objecte `DEFAULT_CHALLENGES` al principi de `server.js`. Cada prova té:
- `question`: Text de la pregunta
- `answers`: Array de respostes vàlides (case-insensitive, sense accents)
- `hint`: Pista opcional

## 🗺️ Camins dels equips

Cada equip segueix un camí diferent. Tots acaben amb la prova "i":

| Equip | Camí |
|-------|------|
| 1 | D → F → A → H → C → E → B → G → **I** |
| 2 | B → G → E → A → F → C → H → D → **I** |
| 3 | H → C → F → D → G → A → E → B → **I** |
| 4 | E → A → G → C → B → H → D → F → **I** |
| 5 | F → D → B → G → A → H → C → E → **I** |
| 6 | C → H → D → E → B → F → G → A → **I** |
| 7 | G → B → H → F → D → A → E → C → **I** |
| 8 | A → E → C → B → H → G → F → D → **I** |
| 9 | H → F → G → D → E → B → A → C → **I** |
| 10 | G → A → D → H → F → C → B → E → **I** |

## 🔑 Contrasenya d'admin

Per defecte: `gimcana2026`

Pots canviar-la amb la variable d'entorn `ADMIN_PASSWORD` a Render.

## 💡 Consells

- **Proveu-ho abans**: Feu una prova ràpida amb 2-3 equips per verificar que tot funciona
- **Connexió**: Assegureu-vos que hi ha WiFi o cobertura mòbil a la casa de colònies
- **Rànquing projectat**: Obriu `/ranking.html` en un ordinador connectat a un projector
- **Si es penja**: L'estat es guarda automàticament, un reinici no perd el progrés
