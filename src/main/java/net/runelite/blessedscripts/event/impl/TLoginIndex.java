package net.runelite.blessedscripts.event.impl;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.event.listener.TextPaintListener;
import net.runelite.blessedscripts.methods.Game;
import net.runelite.blessedscripts.util.StringUtil;

import java.awt.*;

public class TLoginIndex implements TextPaintListener {

	private final Game game;

	public TLoginIndex(BotLite bot) {
		game = bot.getMethodContext().game;
	}

	public int drawLine(final Graphics render, int idx) {
		StringUtil.drawLine(render, idx++, "Client State: " + game.getClientState());
		return idx;
	}

}
