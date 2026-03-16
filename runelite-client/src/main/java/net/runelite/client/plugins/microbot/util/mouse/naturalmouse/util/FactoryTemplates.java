package net.runelite.client.plugins.microbot.util.mouse.naturalmouse.util;

import java.awt.Point;

/**
 * Stub implementation of FactoryTemplates
 */
public class FactoryTemplates {
    
    public static Point createRandomPoint(Point min, Point max) {
        return new Point(
            min.x + (int)(Math.random() * (max.x - min.x)),
            min.y + (int)(Math.random() * (max.y - min.y))
        );
    }
    
    public static Point createRandomPointInCircle(Point center, int radius) {
        double angle = Math.random() * 2 * Math.PI;
        double r = Math.sqrt(Math.random()) * radius;
        return new Point(
            center.x + (int)(r * Math.cos(angle)),
            center.y + (int)(r * Math.sin(angle))
        );
    }
}
