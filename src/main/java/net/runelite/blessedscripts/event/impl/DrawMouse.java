package net.runelite.blessedscripts.event.impl;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.internal.input.VirtualMouse;
import net.runelite.blessedscripts.event.listener.PaintListener;
import net.runelite.blessedscripts.methods.MethodContext;

import java.awt.*;
import java.util.LinkedList;
import java.util.List;

public class DrawMouse implements PaintListener {
	private final MethodContext ctx;
	public DrawMouse(BotLite bot) {
		ctx = bot.getMethodContext();
	}

	private double getRot() {
		return System.currentTimeMillis() % 3600 / 10.0D;
	}

	public void onRepaint(final Graphics render) {
		VirtualMouse mouse = ctx.virtualMouse;
		if (mouse != null) {
			final Point location = new Point(mouse.getClientX(), mouse.getClientY());
			Graphics2D g = (Graphics2D) render.create();
			Graphics2D gg = (Graphics2D) render.create();
			g.setColor(Color.GREEN);
			g.rotate(Math.toRadians(getRot()), location.x, location.y);
			g.drawLine(location.x, location.y - 5, location.x, location.y + 5);
			g.drawLine(location.x - 5, location.y, location.x + 5, location.y);
		}
	}
}
