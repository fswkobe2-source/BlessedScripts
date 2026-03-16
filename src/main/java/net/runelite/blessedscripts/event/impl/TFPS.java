package net.runelite.blessedscripts.event.impl;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.event.listener.TextPaintListener;
import net.runelite.blessedscripts.methods.MethodContext;
import net.runelite.blessedscripts.util.StringUtil;

import java.awt.*;

public class TFPS implements TextPaintListener {
	private MethodContext ctx;

	public TFPS(BotLite bot) {
		this.ctx = bot.getMethodContext();
	}

	public int drawLine(final Graphics render, int idx) {
		StringUtil.drawLine(render, idx++, String.format("%2d fps", ctx.client.getFPS()));
		return idx;
	}
}
