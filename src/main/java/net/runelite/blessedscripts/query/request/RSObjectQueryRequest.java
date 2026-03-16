package net.runelite.blessedscripts.query.request;

import net.runelite.blessedscripts.wrappers.RSObject;

import java.util.Arrays;
import java.util.List;

import static net.runelite.blessedscripts.methods.MethodProvider.methods;

public class RSObjectQueryRequest extends PositionableQueryRequest<RSObject> {
    public RSObjectQueryRequest() {
        super( 26);
    }
    public List<RSObject> request() {
        return Arrays.asList(methods.objects.getAll());
    }
}
