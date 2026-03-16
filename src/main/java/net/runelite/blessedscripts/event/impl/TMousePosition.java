package net.runelite.blessedscripts.event.impl;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.internal.input.VirtualMouse;
import net.runelite.blessedscripts.event.listener.TextPaintListener;
import net.runelite.blessedscripts.methods.MethodContext;
import net.runelite.blessedscripts.util.StringUtil;

import java.awt.*;

public class TMousePosition implements TextPaintListener {

	private final MethodContext ctx;

	public TMousePosition(BotLite bot) {
		ctx = bot.getMethodContext();
	}

	public int drawLine(final Graphics render, int idx) {
		final VirtualMouse mouse = ctx.virtualMouse;
		if (mouse != null) {
			final int mouse_x = mouse.getClientX();
			final int mouse_y = mouse.getClientY();
			String off = mouse.isClientPresent() ? "" : " (off)";
			StringUtil.drawLine(render, idx++, "Mouse Position: (" + mouse_x + "," + mouse_y + ")" + off);
		}

		return idx;
	}
}
