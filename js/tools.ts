"use strict";

import { Collection } from "@discordjs/collection";

export class Tools {
    baseColumn = [
        "<tr>",
        '<td width="120px"><input type="text" class="username"></td>',
        '<td width="110px"><p class="status"></p></td>',
        "</tr>",
    ].join("\n");
    pointInput = '<td width="80px"><input type="number" class="point"></td>';
    players = new Collection<number, IPlayerData>();
    playersElement = new Collection<number, NodeListOf<HTMLTableCellElement>>();

    // eslint-disable-next-line no-empty-function
    costructor() {}

    instance(): void {
        const copyPlayer = document.getElementById("copyplayer");
        if (!copyPlayer) throw new Error("A button which has an id named copyplayer not found");
        copyPlayer.addEventListener("click", () => void this.clipPlayers());

        const addPlayer = document.getElementById("addplayer");
        if (!addPlayer) throw new Error("A button which has an id named addplayer not found");
        addPlayer.addEventListener("click", () => this.addTableColumn(1));

        const removePlayer = document.getElementById("removeplayer");
        if (!removePlayer) throw new Error("A button which has an id named removeplayer not found");
        removePlayer.addEventListener("click", () => {
            this.getTableData();
            const lastIndex = this.players.size - 1;
            this.removeTableColumn(lastIndex, true);
        });

        const addRound = document.getElementById("addround");
        if (!addRound) throw new Error("A button which has an id named addround not found");
        addRound.addEventListener("click", () => this.addBattleRounds(1));

        const removeRound = document.getElementById("removeround");
        if (!removeRound) throw new Error("A button which has an id named removeround not found");
        removeRound.addEventListener("click", () => this.removeBattleRound(this.getCurrentRound() ?? 1, true));
    }

    getTableElement(): HTMLElement {
        const table = document.getElementById("table");
        if (!table) throw new Error("Table which has an id named table not found");
        return table;
    }

    getTableRowElements(): NodeListOf<HTMLTableRowElement> {
        return this.getTableElement().querySelectorAll("tr");
    }

    getTableData(
        setMap: boolean = true,
        init?: boolean
    ): [Collection<number, IPlayerData>, Collection<number, NodeListOf<HTMLTableCellElement>>] {
        const players = new Collection<number, IPlayerData>();
        if (setMap) {
            this.players.clear();
            this.playersElement.clear();
        }
        const playersElement = new Collection<number, NodeListOf<HTMLTableCellElement>>();
        const table = this.getTableElement();
        const rows = table.querySelectorAll("tr");
        if (!rows.length) return [players, playersElement];
        let index = 0;

        for (const row of rows.values()) {
            const itemKeys = row.querySelectorAll("td");
            if (!itemKeys.length) continue;
            const currentIndex = index;

            const playerData: IPlayerData = {
                name: "",
                index: currentIndex,
                status: "Playing",
                rounds: [],
            };
            let round = 0;

            for (const item of itemKeys.values()) {
                if (!item.firstElementChild) continue;
                const itemElement = item.firstElementChild;
                const currentRound = round;

                if (this.isInputElement(itemElement) && itemElement.className === "username") {
                    if (init) {
                        itemElement.oninput = () => this.onNameChange(currentIndex);
                        itemElement.onkeydown = (e) => this.onKeydown(e, currentIndex, 0);
                    }
                    if (itemElement.value) {
                        playerData.name = itemElement.value;
                    }
                } else if (
                    itemElement.tagName === "P" &&
                    itemElement.className === "status" &&
                    this.isValidStatus(itemElement.textContent)
                ) {
                    playerData.status = itemElement.textContent;
                } else if (this.isInputElement(itemElement) && itemElement.className === "point") {
                    if (init && (itemElement.value || playerData.status !== "Eliminated")) {
                        itemElement.oninput = () => this.onPointInput(currentIndex, currentRound);
                        itemElement.onkeydown = (e) => this.onKeydown(e, currentIndex, currentRound + 2);
                    }
                    if (itemElement.value && itemElement.value !== "-") {
                        const possibleInteger = parseInt(itemElement.value, 10);
                        if (Number.isNaN(possibleInteger)) {
                            alert("Please enter a valid number.");
                            this.players.delete(currentIndex);
                            break;
                        }
                        playerData.rounds.push(possibleInteger);
                    }
                    round++;
                }
            }
            if (setMap) {
                this.players.set(currentIndex, playerData);
                this.playersElement.set(currentIndex, itemKeys);
            }
            players.set(currentIndex, playerData);
            playersElement.set(currentIndex, itemKeys);
            index++;
        }
        this.updatePlayerList();
        return [players, playersElement];
    }

    getNonEmptyPlayers(): Collection<number, IPlayerData> {
        return this.players.filter((p) => !this.isEmptyName(p.name));
    }

    getNonEmptyPlayersElement(): Collection<number, NodeListOf<HTMLTableCellElement>> {
        const targetPlayers = new Collection<number, NodeListOf<HTMLTableCellElement>>();

        for (const { index } of this.getNonEmptyPlayers().values()) {
            if (!this.playersElement.has(index)) continue;
            targetPlayers.set(index, this.playersElement.get(index)!);
        }
        return targetPlayers;
    }

    onNameChange(index: number): void {
        const tableRowElement = this.getTableRowElements()[index + 2];
        if (!tableRowElement) return;
        const player = this.players.get(index);
        let emptyName = false;

        for (const { firstElementChild: element } of tableRowElement.querySelectorAll("td").values()) {
            if (!element) continue;
            if (this.isInputElement(element) && element.className === "username" && this.isEmptyName(element.value)) {
                emptyName = true;
            } else if (element.tagName === "P" || element.className === "status") {
                const eliminated = player ? (player.rounds.at(-1) ? (player.rounds.at(-1)! < 0 ? true : false) : false) : false;
                element.textContent = eliminated ? "Eliminated" : emptyName ? "" : "Playing";
                break;
            }
        }
        this.getTableData();
    }

    onPointInput(index: number, round: number): void {
        this.getTableData();
        const tableRowElements = this.getTableRowElements()[index + 2];
        if (!tableRowElements) return;
        const player = this.players.get(index);
        if (!player) return;
        let statusElement: Element | undefined = undefined;
        let isLatestPointNaN = false;
        let i = 0;

        for (const { firstElementChild: element } of tableRowElements.querySelectorAll("td").values()) {
            if (!element) continue;
            if (element.tagName === "P" && element.className === "status") {
                statusElement = element;
                continue;
            } else if (this.isInputElement(element) && element.className === "point") {
                if (element.value) {
                    if (i === index) {
                        if (element.value !== "-" && Number.isNaN(parseInt(element.value))) {
                            isLatestPointNaN = true;
                        }
                    }
                } else {
                    if ((player.rounds[round] || player.rounds[round] === 0) && player.rounds[round]! < 0) {
                        element.className = "disabled-point";
                        element.disabled = true;
                    }
                }
                i++;
            } else if (this.isInputElement(element) && element.className === "disabled-point" && !element.value) {
                if (!player.rounds[round] || player.rounds[round]! >= 0) {
                    element.className = "point";
                    element.disabled = false;
                }
                i++;
            }
        }
        if (statusElement) {
            if (!player.rounds[round] && player.rounds[round] !== 0 && this.isEmptyName(player.name)) {
                if (!isLatestPointNaN) statusElement.textContent = "";
            } else {
                statusElement.textContent = player.rounds[round]! < 0 ? "Eliminated" : "Playing";
            }
        }
        this.getTableData();
    }

    onKeydown(event: KeyboardEvent, column: number, row: number): void {
        if (!document.activeElement || !this.isInputElement(document.activeElement)) return;
        let targetColumn = column,
            targetRow = row;
        const currentRound = this.getCurrentRound() ?? 0;
        const currentFocus = document.activeElement;

        switch (event.key) {
            case "ArrowUp":
            case "PageUp": {
                if (!column) {
                    event.preventDefault();
                    return;
                }
                targetColumn--;
                break;
            }

            case "ArrowRight": {
                const isSelectionAtEnd =
                    currentFocus.selectionStart === currentFocus.selectionEnd && currentFocus.selectionEnd === currentFocus.value.length;
                if (currentRound + 1 === row || !isSelectionAtEnd) return;
                targetRow += row === 0 ? 2 : 1;
                break;
            }

            case "ArrowDown":
            case "PageDown":
            case "Enter": {
                if (this.players.size - 1 === column) {
                    event.preventDefault();
                    return;
                }
                targetColumn++;
                break;
            }

            case "ArrowLeft": {
                const isSelectionAtStart = currentFocus.selectionStart === currentFocus.selectionEnd && !currentFocus.selectionStart;
                if (!row || !isSelectionAtStart) return;
                targetRow -= row === 2 ? 2 : 1;
                break;
            }

            case "Escape": {
                document.activeElement.blur();
                break;
            }

            default:
                return;
        }

        if (event.key === "Escape") return;

        const targetTableRowElement = this.getTableRowElements()[targetColumn + 2];
        if (!targetTableRowElement) throw new Error("You cant scroll more than this column");
        const targetTableCellElement = targetTableRowElement.querySelectorAll("td")[targetRow];
        if (!targetTableCellElement) throw new Error("You cant scroll more than this row");
        const input = targetTableCellElement.firstElementChild;
        if (!input || !this.isInputElement(input)) throw new Error("input element not found");
        if (input.disabled) return this.onKeydown(event, targetColumn, targetRow);

        input.focus();
        input.select();
        event.preventDefault();
    }

    updatePlayerList(): void {
        const playerListElement = document.getElementById("players");
        if (!playerListElement) throw new Error("Could not update players");
        const players = this.players.filter((p) => !this.isEmptyName(p.name) && p.status === "Playing");
        const possibleRound = players.reduce((p, c) => Math.max(p, c.rounds.length), 1);
        const round =
            players.every((p) => p.rounds.length === players.first()!.rounds.length) && players.first()?.rounds.length
                ? possibleRound + 1
                : possibleRound;

        playerListElement.textContent =
            "Round " +
            round.toString(10) +
            " Players (" +
            players.size +
            "): " +
            players
                .map((p) => {
                    const sumPoint = this.addAll(p.rounds);
                    return sumPoint ? p.name + "(" + this.addAll(p.rounds) + ")" : p.name;
                })
                .join(", ");
    }

    addTableColumn(column?: number): void {
        column ??= 1;
        const currentRound = this.getCurrentRound() ?? 0;
        const additionPointInput = Array(currentRound).fill(this.pointInput, 0).join("\n");
        const addition = this.baseColumn.split("\n");
        addition.splice(-1, 0, additionPointInput);
        this.getTableElement().insertAdjacentHTML("beforeend", "\n" + Array(column).fill(addition.join("\n"), 0).join("\n"));
        this.getTableData(true, true);
    }

    removeTableColumn(index: number, fromButton?: boolean): void {
        const table = this.getTableElement();
        const rows = table.querySelectorAll("tr");
        if (!rows.length) return;
        let i = 0;

        for (const row of rows.values()) {
            const itemKeys = row.querySelectorAll("td");
            if (!itemKeys.length) continue;

            if (i === index) {
                for (const item of itemKeys.values()) {
                    if (!item.firstElementChild) continue;
                    const itemElement = item.firstElementChild;

                    if (this.isInputElement(itemElement)) {
                        if (
                            fromButton &&
                            itemElement.value &&
                            itemElement.className === "username" &&
                            !this.isEmptyName(itemElement.value)
                        ) {
                            const sureToDelete = confirm(`Are you sure to delete ${itemElement.value}'s line?`);
                            if (!sureToDelete) return;
                        }
                        itemElement.oninput = null;
                    }
                }
                row.remove();
                break;
            }
            i++;
        }
        this.players.clear();
        this.playersElement.clear();
        this.getTableData();
    }

    getHeaders(rounds: number): string {
        return [
            '<th id="users" rowspan="2">Users</th>',
            '<th rowspan="2">Status</th>',
            `<th colspan="${rounds || 1}"><span style=font-weight: 400;">Rounds</span></th>`,
        ].join("\n");
    }

    getRoundHeader(round: number): string {
        return `<th>Round ${round || 1}</th>`;
    }

    getCurrentRound(): number | null {
        const { innerHTML } = this.getTableRowElements()[1]!;
        const possibleRound =
            innerHTML
                .split("<th>")
                .at(-1)
                ?.trim()
                ?.match(/Round (?<round>\d+)<\/th>/)?.groups?.round ?? null;
        return possibleRound === null ? possibleRound : parseInt(possibleRound);
    }

    addBattleRounds(rounds?: number) {
        rounds ||= 1;
        const tableRowElements = this.getTableRowElements();
        this.getTableData();
        const currentRound = this.getCurrentRound() ?? 0;

        for (let i = 0; i < tableRowElements.length; i++) {
            if (i === 0) {
                tableRowElements[i]!.innerHTML = this.getHeaders(currentRound + rounds);
            } else if (i === 1) {
                for (let j = 1; j <= rounds; j++) {
                    if (j !== 1) tableRowElements[i]!.insertAdjacentHTML("beforeend", "\n");
                    tableRowElements[i]!.insertAdjacentHTML("beforeend", this.getRoundHeader(j + currentRound));
                }
            } else {
                for (let k = 0; k < rounds; k++) {
                    if (k !== 0) tableRowElements[i]!.insertAdjacentHTML("beforeend", "\n");
                    tableRowElements[i]!.insertAdjacentHTML("beforeend", this.pointInput);
                }
            }
        }
        this.getTableData(true, true);
    }

    removeBattleRound(round: number, fromButton?: boolean): void {
        const index = round - 1;
        if (fromButton) {
            if (
                this.players.some((p) => p.rounds[index] || p.rounds[index] === 0) &&
                !confirm("Are you sure to delete round " + (index + 1) + " data")
            )
                return;
        }
        const tableRowElements = this.getTableRowElements();
        this.getTableData();

        for (let i = 0; i < tableRowElements.length; i++) {
            if (i === 0) {
                tableRowElements[i]!.innerHTML = this.getHeaders(index);
            } else if (i === 1) {
                let text = "";
                for (let j = 1; j < round; j++) {
                    if (text) text += "\n";
                    text += this.getRoundHeader(j);
                }
                tableRowElements[i]!.innerHTML = text;
            } else {
                const targetRound = tableRowElements[i]!.querySelectorAll("td")[index + 2];
                if (!targetRound) continue;
                targetRound.remove();
            }
        }
        this.getTableData(true, true);
    }

    clipPlayers(): Promise<void> {
        this.updatePlayerList();
        const text = document.getElementById("players")?.textContent;
        if (!text) throw new Error("Could not get players data");
        const [beforeColon, afterColon] = text.split(":");

        return this.writeClipboard("**" + beforeColon + "**:" + afterColon);
    }

    writeClipboard(text: string): Promise<void> {
        return navigator.clipboard.writeText(text);
    }

    addAll(rounds: number[]): number {
        return rounds.reduce((p, c) => c + p, 0);
    }

    isEmptyName(name: string): boolean {
        return !name || name.split("").every((s) => /\s/.test(s));
    }

    isInputElement(element: Element | null): element is HTMLInputElement {
        return element?.tagName === "INPUT";
    }

    isValidStatus(status: string | null): status is IPlayerData["status"] {
        return status === "Playing" || status === "Eliminated";
    }
}

export interface IPlayerData {
    name: string;
    index: number;
    status: "Playing" | "Eliminated";
    rounds: number[];
}
