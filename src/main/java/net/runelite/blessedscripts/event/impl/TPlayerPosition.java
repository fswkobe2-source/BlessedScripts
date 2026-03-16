package net.runelite.blessedscripts.event.impl;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.event.listener.TextPaintListener;
import net.runelite.blessedscripts.methods.MethodContext;
import net.runelite.blessedscripts.util.StringUtil;
import net.runelite.blessedscripts.wrappers.RSTile;

import java.awt.*;

public class TPlayerPosition implements TextPaintListener {
	private MethodContext ctx;

	public TPlayerPosition(BotLite bot) {
		ctx = bot.getMethodContext();
	}

	public int drawLine(final Graphics render, int idx) {
		if (ctx.client.getLocalPlayer() != null) {
			final RSTile position = ctx.players.getMyPlayer().getLocation();
			StringUtil.drawLine(render, idx++, "Player " + position.getWorldLocation().toString());
			StringUtil.drawLine(render, idx++, "Player " + position.getLocalLocation(ctx).toString());
			return idx;
		}
		return idx+2;
	}
}
