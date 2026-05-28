import { BaseProperty, BooleanPropertyClass, EnumPropertyClass, ImageSourcePropertyClass, NumberPropertyClass, Point2DPropertyClass, Point3DPropertyClass, StringPropertyClass } from "@/editor/properties/properties";
import { StringPropertyEditor } from "../../propertyEditor/StringPropertyEditor";
import { SliderPropertyEditor } from "../../propertyEditor/SliderPropertyEditor";
import { NumberPropertyEditor } from "../../propertyEditor/NumberPropertyEditor";
import { BooleanPropertyEditor } from "../../propertyEditor/BooleanPropertyEditor";
import { EnumPropertyEditor } from "../../propertyEditor/EnumPropertyEditor";
import { Point2DPropertyEditor } from "../../propertyEditor/Point2DPropertyEditor";
import { Point3DPropertyEditor } from "../../propertyEditor/Point3DPropertyEditor";
import { ImageSourcePropertyEditor } from "../../propertyEditor/ImageSourcePropertyEditor";

type PropertyRowProps = {
    property: BaseProperty<any>;
}
export default function PropertyRow({ property }: PropertyRowProps) {
    if (property instanceof StringPropertyClass) {
        return <StringPropertyEditor key={property.id} property={property} />
    } else if (property instanceof NumberPropertyClass) {
        if (property.slider) {
            return <SliderPropertyEditor key={property.id} property={property} slider={property.slider} />
        } else {
            return <NumberPropertyEditor key={property.id} property={property} />
        }
    } else if (property instanceof BooleanPropertyClass) {
        return <BooleanPropertyEditor key={property.id} property={property} />
    } else if (property instanceof EnumPropertyClass) {
        return <EnumPropertyEditor key={property.id} property={property} />
    } else if (property instanceof Point2DPropertyClass) {
        return <Point2DPropertyEditor key={property.id} property={property} />
    } else if (property instanceof Point3DPropertyClass) {
        return <Point3DPropertyEditor key={property.id} property={property} />
    } else if (property instanceof ImageSourcePropertyClass) {
        return <ImageSourcePropertyEditor key={property.id} property={property} />
    }
    return null;
}
