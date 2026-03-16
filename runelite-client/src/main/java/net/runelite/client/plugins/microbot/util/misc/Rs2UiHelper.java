package net.runelite.client.plugins.microbot.util.misc;

import net.runelite.api.Point;
import net.runelite.api.widgets.Widget;
import net.runelite.api.coords.WorldPoint;
import java.awt.Rectangle;

/**
 * Stub implementation of Rs2UiHelper
 */
public class Rs2UiHelper {
    
    public static Point getClickingPoint(Rectangle rectangle, boolean randomize) {
        return new Point(rectangle.x + rectangle.width / 2, rectangle.y + rectangle.height / 2);
    }
    
    public static Rectangle getTileClickbox(net.runelite.api.Tile tile) {
        return new Rectangle(0, 0, 36, 36);
    }
    
    public static boolean isPointInScreen(Point point) {
        return point.getX() >= 0 && point.getY() >= 0;
    }
    
    public static void sleep(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
    
    public static String stripColTags(String text) {
        // Stub implementation - just return the text as-is
        return text;
    }
    
    public static boolean isRectangleWithinRectangle(Rectangle rect1, Rectangle rect2) {
        return rect1 != null && rect2 != null && 
               rect2.contains(rect1.x, rect1.y) && 
               rect2.contains(rect1.x + rect1.width, rect1.y + rect1.height);
    }
}
