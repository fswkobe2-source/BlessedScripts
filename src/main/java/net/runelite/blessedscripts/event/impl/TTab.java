package net.runelite.blessedscripts.event.impl;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.event.listener.TextPaintListener;
import net.runelite.blessedscripts.internal.globval.enums.InterfaceTab;
import net.runelite.blessedscripts.methods.Game;
import net.runelite.blessedscripts.util.StringUtil;

import java.awt.*;

public class TTab implements TextPaintListener {
	private final Game game;

	public TTab(BotLite bot) {
		game = bot.getMethodContext().game;
	}

	public int drawLine(final Graphics render, int idx) {
		final InterfaceTab currentTab = game.getCurrentTab();
		StringUtil.drawLine(render, idx++,
				//Ints.asList(Game.TABS).indexOf lets us actually find the object with the value of cTab rather than the obvious array out of bounds you'd normally get
				"Current Tab: " + currentTab + (currentTab != null ? " (" + currentTab.getName() + ")" : ""));
		return idx;
	}
}
