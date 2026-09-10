# Troubleshooting: GC 3600 Claude Code Setup

Match the student's exact error text to a row. Confirm the fix worked by re-running
the command that failed.

## Install and launch

| What they see | What is actually wrong | Fix |
|---|---|---|
| `command not found: claude` (Mac) | The installer finished but the terminal is using an old PATH | Quit Terminal completely (Cmd+Q, not just close the window) and reopen. If it still fails, run `source ~/.zshrc` |
| `'claude' is not recognized...` (Windows) | Same PATH issue | Close PowerShell entirely and reopen it |
| `The token '&&' is not a valid statement separator` | They ran the CMD command inside PowerShell | Their prompt starts with `PS C:\`. Use the PowerShell command: `irm https://claude.ai/install.ps1 \| iex` |
| `'irm' is not recognized as an internal or external command` | They ran the PowerShell command inside CMD | Their prompt has no `PS`. Either switch to PowerShell, or use the CMD install command |
| `syntax error near unexpected token '<'` | The download returned an HTML error page, usually campus wifi or a proxy | Try a different network or a phone hotspot. Clemson campus wifi with a captive portal is a common cause |
| `403` during install | Firewall or proxy blocking the download | Same as above. Try off-campus or hotspot |
| Installer runs but nothing happens after | They may have installed in WSL and are launching from PowerShell, or the reverse | Whichever terminal they installed in is the one that has `claude`. Use the same one |

## Login and account

| What they see | What is actually wrong | Fix |
|---|---|---|
| Login page says the plan does not include Claude Code | They are on the free Claude.ai plan | Claude Code requires Pro, Max, Team, Enterprise, or a Console (API) account. There is no free tier. Tell them to check with the instructor about the class plan before paying for anything |
| Browser opens but the login never completes | The browser cannot reach the local callback | In the terminal, press `c` to copy the code, then paste it into the browser page manually |
| `Login expired` on a later session | Credentials aged out | Run `claude`, then type `/login` |
| Logged into the wrong account | Personal vs school account mixup | Type `/login` and pick the right one. `/status` shows which account is active |

## Inside a session

| What they see | What is actually wrong | Fix |
|---|---|---|
| Claude cannot see their files | Claude Code was launched from the wrong folder | Type `/exit`, then `cd` into the project folder, then `claude`. Confirm with `pwd` |
| Claude ignores their design brief | CLAUDE.md is missing, empty, or in the wrong folder | CLAUDE.md must be in the project root, the same folder they launched `claude` from. Run `ls` to confirm it is there |
| Claude keeps asking permission for everything | Manual permission mode | Shift+Tab cycles permission modes. Explain what each mode allows before they switch |
| Claude edited a file they did not want changed | They approved an edit without reading it | Show them `git status` and `git diff` to see what changed, and how to undo with `git checkout -- <file>` if the folder is a git repository. This is the argument for running `git init` early |
| Git not found on Windows | Git for Windows is not installed | Install from git-scm.com/downloads/win, then restart Claude Code. It is optional but recommended |
| Search or file finding fails | ripgrep issue | Run `claude doctor` and read the warnings out loud to the student |

## Rules for the assistant

- Never say "try reinstalling" as a first move. It is almost never the problem and
  it costs the student twenty minutes.
- Always get the exact error text. "It didn't work" is not enough to diagnose.
- If two things are broken, fix the earlier one first. Install before login,
  login before folder, folder before CLAUDE.md.
