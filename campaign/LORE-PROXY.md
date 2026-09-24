# The Lore pane from any browser: runbook

The GM Lore pane at https://portents.sortilege.online/gm/ searches the L5R wiki index that runs
on the desktop (`helheim`). Tailscale Funnel publishes that server at a fixed https address. The
server refuses every request that lacks the token. The index, the wiki text and the token all
stay on the desktop. When the desktop is off, the pane says the server did not answer.

```
browser ──https──> Tailscale Funnel ──> helheim: tailscaled ──> 127.0.0.1:8797 lore serve (token check)
```

| Part | Where | Starts at boot |
|---|---|---|
| Address to paste into Settings | `https://helheim.tail926c54.ts.net` | — |
| `lore serve --require-token` | user service `l5r-lore` (`~/Sortilege/Experiments/l5r-lore/tools/l5r-lore.service`) | yes, lingering is on |
| The token | `~/.config/l5r-lore/serve.env` (`LORE_TOKEN=…`, mode 600, never in a repo) | — |
| Funnel 443 → 127.0.0.1:8797 | `tailscaled`'s own saved config | yes, system service |
| Ollama (semantic search; without it, search is keyword-only) | system service `ollama` | yes |

## Start

Nothing to do after a reboot: all three services come back on their own. By hand:

```bash
systemctl --user start l5r-lore
tailscale funnel --bg 8797
```

Stop publishing (the server keeps answering on this machine; `reset` clears every serve and
funnel entry, and this one is the only one on `helheim`):

```bash
tailscale funnel reset
```

## Check

```bash
tailscale funnel status
systemctl --user status l5r-lore --no-pager
curl -s -o /dev/null -w '%{http_code}\n' https://helheim.tail926c54.ts.net/health
set -a; . ~/.config/l5r-lore/serve.env; set +a
curl -s -H "Authorization: Bearer $LORE_TOKEN" https://helheim.tail926c54.ts.net/health
```

The first curl must print `401`. The second prints `{"ok": true, … "pages": 46109}`.

In the pane: open **Settings** on the GM page, put the address in the Lore server's field and
the token in the field below it. The status line should read *Answering · 46109 pages*. The
settings live in that browser only, per site: the live site and `localhost` each need their
own copy.

| The pane says | Meaning |
|---|---|
| *the server needs a token* | The token field is empty. |
| *the server refused the token* | The token is wrong or was rotated. Paste the current one. |
| *did not answer (Failed to fetch)* | The desktop is off, or `l5r-lore` or the funnel is down. Run the checks above. |

## Rotate the token

```bash
umask 077
printf 'LORE_TOKEN=%s\n' "$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')" > ~/.config/l5r-lore/serve.env
systemctl --user restart l5r-lore
grep -o '=.*' ~/.config/l5r-lore/serve.env | cut -c2-
```

The last line prints the new token. Paste it into Settings in every browser that uses the pane.
The old token stops working as soon as the service restarts.

## Install from scratch

On a new machine: follow the header of `tools/l5r-lore.service` in l5r-lore. Then enable Funnel
for the tailnet: `tailscale funnel --bg 8797` prints the admin link the first time.
