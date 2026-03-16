package net.runelite.blessedscripts.event.impl;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.event.listener.TextPaintListener;
import net.runelite.blessedscripts.methods.MethodContext;
import net.runelite.blessedscripts.util.StringUtil;

import java.awt.*;

public class TAnimation implements TextPaintListener {

	private final MethodContext ctx;

	public TAnimation(BotLite bot) {
		ctx = bot.getMethodContext();
	}

	public int drawLine(final Graphics render, int idx) {
		int animation;
		if (ctx.game.isLoggedIn()) {
			animation = ctx.players.getMyPlayer().getAnimation();
		} else {
			animation = -1;
		}
		StringUtil.drawLine(render, idx++, "Animation " + animation);
		return idx;
	}

}
