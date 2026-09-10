# Final Verification Checklist

Actually run each check. Do not assume. Report pass or fail with the real output.

## Install
- [ ] `claude --version` prints a version number
- [ ] `claude doctor` reports no blocking errors
- [ ] Claude Code launches with `claude` and accepts a message

## Account
- [ ] `/status` shows a logged-in account on a plan that includes Claude Code
- [ ] The student knows which account they are logged into

## Project folder
- [ ] `pwd` shows a folder dedicated to this website, not Desktop or home
- [ ] `ls` shows `index.html`, `styles.css`, `images/`, and `CLAUDE.md`
- [ ] `git status` works, meaning the folder is a git repository

## CLAUDE.md
- [ ] It exists in the project root
- [ ] Every section contains the student's own words, no placeholder text left
- [ ] Colors are real hex values, not "TBD" or a color name
- [ ] The "How I want to work with Claude" section is filled in
- [ ] The decisions log has at least one entry

## Understanding
Ask the student these out loud. Do not accept a one word answer.
- [ ] What does CLAUDE.md do, and when does Claude read it?
- [ ] How do you make Claude show a plan before it edits files?
- [ ] When should you use `/clear`, and why?
- [ ] What do you do when Claude proposes a design choice you disagree with?

## To submit
- [ ] Screenshot of `claude --version` and `claude doctor`
- [ ] Their CLAUDE.md file
- [ ] Short answers from the worksheet
