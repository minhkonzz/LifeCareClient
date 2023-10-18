import { FC, useState, useEffect, useRef, memo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Platform, 
    StatusBar, 
    Pressable, 
    Animated,
    ScrollView
} from 'react-native'

import { Colors } from '@utils/constants/colors'
import { horizontalScale as hS, verticalScale as vS } from '@utils/responsive'
import { useDeviceBottomBarHeight } from '@hooks/useDeviceBottomBarHeight' 
import DayPlanItem from '@components/day-plan-item'
import Button from '@components/shared/button/Button'
import BackIcon from '@assets/icons/goback.svg'
import WhiteBackIcon from '@assets/icons/goback-white.svg'
import EditPrimary from '@assets/icons/edit-primary.svg'
import RestaurantIcon from '@assets/icons/restaurant.svg'
import ElectroIcon from '@assets/icons/electro.svg'
import LightIcon from '@assets/icons/light.svg'
import LinearGradient from 'react-native-linear-gradient'

const darkPrimary: string = Colors.darkPrimary.hex

const TimeSetting: FC = () => {
    return (
        <View style={styles.fastingTimes}>
	    <View style={{ 
	        marginBottom: vS(22),
	        alignSelf: 'flex-start' 
	    }}>
		<View style={styles.horz}>
		    <ElectroIcon width={hS(10)} height={vS(12.5)} />
		    <Text style={styles.hrsDesc}>14 hours fasting</Text>
		</View>
		<View style={[styles.horz, { marginTop: vS(12) }]}>
		    <RestaurantIcon width={hS(11)} height={vS(11)} />
		    <Text style={styles.hrsDesc}>10 hours eating period</Text>
		</View>
	    </View>
            <View style={{ width: '100%' }}>
                <View style={[styles.horz, styles.timeSetting]}>
                    <View style={styles.horz}>
                        <View style={[styles.timeSettingDecor, { backgroundColor: Colors.primary.hex }]} />
                        <Text style={styles.timeSettingTitleText}>Start</Text>
                    </View>
                    <View style={styles.horz}>
                        <Text style={styles.timeSettingValueText}>Today, 8:30 PM</Text>
                        <EditPrimary width={hS(16)} height={vS(16)} />
                    </View>
                </View>
                <View style={[styles.horz, styles.timeSetting, { marginTop: vS(28) }]}>
                    <View style={styles.horz}>
                        <View style={[styles.timeSettingDecor, { backgroundColor: 'rgb(255, 155, 133)' }]} />
                        <Text style={styles.timeSettingTitleText}>End</Text>
                    </View>
                    <View style={styles.horz}>
                        <Text style={styles.timeSettingValueText}>Today, 8:30 PM</Text>
                        <EditPrimary width={hS(16)} height={vS(16)} />
                    </View>
                </View>
            </View>
            <Text style={styles.timeNote}>Please select the time you start fasting</Text>
        </View>
    )
}

const Content: FC = memo(() => {
    return (
	<View style={styles.main}>
	    <LinearGradient 
	    	style={styles.primeDecor}
		colors={[`rgba(${Colors.primary.rgb.join(', ')}, .6)`, Colors.primary.hex]}
		start={{ x: .5, y: 0 }}
		end={{ x: .5, y: 1 }}
	    />
	    <View style={{ 
	        width: '100%', 
		alignItems: 'center', 
		paddingHorizontal: hS(24) 
	    }}>
	        <Text style={styles.planNameTitle}>14-10</Text>
	        <TimeSetting />
	        <LinearGradient 
	            style={styles.notes}
		    colors={[`rgba(${Colors.lightPrimary.rgb.join(', ')}, .3)`, Colors.lightPrimary.hex]}
		    start={{ x: .5, y: 0 }}
		    end={{ x: .52, y: .5 }}>
		    <View style={[styles.horz, { marginBottom: vS(5) }]}>
		        <LightIcon width={hS(12)} height={vS(16.5)} />
		        <Text style={styles.notesTitle}>BEFORE FASTING</Text>
		    </View>
		    {
			[
			    'Eat enough protein, such as meat, fish, tofu and nuts', 
			    'Eat high-fiber foods, such as nuts, beans, fruits amd vegetables', 
			    'Drink plenty of water', 
			    'Fill yourself with natural foods to help control your appetize at meal times'
			]
			.map((e, i) => 
			    <View key={i} style={styles.note}>
				<View style={styles.noteDecor} />
				<Text style={styles.noteText}>{e}</Text>
			    </View>
			)
		    }	
	        </LinearGradient>
	    </View>
	</View>
    )
})

export default (): FC => {
    const bottomBarHeight: number = useDeviceBottomBarHeight()
    const [ headerStyles, setHeaderStyles ] = useState<string>('')
    const headerColor = useRef<Animated.Value>(new Animated.Value(0)).current
    
    useEffect(() => {
	animateHeaderColor()
    }, [headerStyles])

    const animateHeaderColor: void = () => {
	Animated.timing(headerColor, {
	    toValue: headerStyles ? 1 : 0,
	    duration: 200, 
	    useNativeDriver: false
	}).start()
    }

    const handleScroll = event => {
	const scrolledY = event.nativeEvent.contentOffset.y
	if (scrolledY > 0) {
	    setHeaderStyles(JSON.stringify({ 
		elevation: 3, 
		shadowColor: `rgba(${Colors.darkPrimary.rgb.join(', ')}, .4)`
	    }))
	    return
	}
	setHeaderStyles('')
    }

    const GoBackIcon = headerStyles && BackIcon || WhiteBackIcon

    return (
        <View style={[styles.container, { paddingBottom: bottomBarHeight }]}>
	    <ScrollView
	        showsVerticalScrollIndicator={false}
	        onScroll={handleScroll}>
	        <Content />
	    </ScrollView>
	    <Animated.View 
	        style={[
		    styles.horz,
		    styles.header, 
		    { 
		        backgroundColor: headerColor.interpolate({
			    inputRange: [0, 1],
			    outputRange: ['transparent', '#fff']
			}), 
			...(headerStyles && JSON.parse(headerStyles) || {})
		    }
		]}>
	    	<Pressable onPress={() => {}}>
		    <GoBackIcon width={hS(9.2)} height={vS(16)} />
		</Pressable>
		<Text style={[styles.headerTitle, { color: headerStyles && darkPrimary || '#fff' }]}>1 day plan</Text>
		<View />
	    </Animated.View>
	</View>
    )
}

const styles = StyleSheet.create({
    container: {
	flex: 1, 
	backgroundColor: '#fff', 
	paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight : 0
    }, 

    horz: {
	flexDirection: 'row', 
	alignItems: 'center'
    },

    header: {
        position: 'absolute', 
	top: 0,
	justifyContent: 'space-between', 
        width: '100%', 
	paddingVertical: vS(22),
	paddingHorizontal: hS(24)
    }, 

    headerTitle: {
	fontFamily: 'Poppins-SemiBold', 
	fontSize: hS(18),
	letterSpacing: .2, 
	marginRight: hS(4)
    }, 

    main: {
        paddingTop: vS(64),
	height: 600, 
	alignItems: 'center'
    },

    primeDecor: {
	width: hS(800), 
	height: vS(800), 
	borderRadius: 1000,
	position: 'absolute', 
	top: vS(-560)
    }, 

    planNameTitle: {
	fontFamily: 'Poppins-SemiBold', 
	fontSize: hS(42), 
	color: '#fff', 
	letterSpacing: .2, 
	marginBottom: vS(12),
	marginLeft: hS(4)
    }, 

    notes: {
	width: '100%', 
	paddingHorizontal: hS(20), 
	paddingVertical: vS(12), 
	borderRadius: hS(32), 
	marginTop: vS(32), 
	alignItems: 'center'
    },

    note: {
	flexDirection: 'row', 
	alignSelf: 'flex-start',
	marginTop: vS(14)
    },

    notesTitle: {
	fontFamily: 'Poppins-SemiBold', 
	fontSize: hS(16), 
	color: darkPrimary, 
	letterSpacing: .2,
	marginLeft: hS(10), 
	marginTop: 2
    },

    noteDecor: {
	width: hS(7), 
	height: vS(7), 
	backgroundColor: `rgba(${Colors.darkPrimary.rgb.join(', ')}, .6)`, 
	borderRadius: 10
    },

    noteText: {
	fontFamily: 'Poppins-Medium', 
	fontSize: hS(11),
	color: darkPrimary, 
	letterSpacing: .2, 
	marginLeft: hS(8),
	marginTop: vS(-5), 
	lineHeight: vS(19)
    },

    fastingTimes: {
        backgroundColor: '#fff',
	alignItems: 'center', 
        paddingTop: vS(20),
        paddingBottom: vS(14),
	paddingHorizontal: hS(24),
	width: '100%',
        elevation: 4,
        shadowColor: `rgba(${Colors.darkPrimary.rgb.join(', ')}, .5)`,
        borderRadius: hS(32)
    },

    planName: {
        position: 'absolute',
        top: vS(-20),
        width: hS(229),
        height: vS(41),
        elevation: 4,
        shadowColor: `rgba(${Colors.darkPrimary.rgb.join(', ')}, .5)`,
        borderRadius: hS(25),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },

    planNameText: {
        fontFamily: 'Poppins-Medium',
        fontSize: hS(12),
        color: Colors.darkPrimary.hex,
        letterSpacing: .2
    },

    hrsDesc: {
	fontFamily: 'Poppins-Regular', 
	fontSize: hS(12),
	color: darkPrimary, 
	letterSpacing: .2,
	marginLeft: hS(12)
    },

    timeSetting: {
        width: '100%',
        justifyContent: 'space-between'
    },

    timeSettingDecor: {
        width: hS(7),
        height: vS(7),
        borderRadius: hS(12)
    },

    timeSettingTitleText: {
        fontFamily: 'Poppins-Regular',
        fontSize: hS(12),
        color: Colors.darkPrimary.hex,
        letterSpacing: .2,
        marginLeft: hS(19)
    },

    timeSettingValueText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: hS(12),
        letterSpacing: .2,
        color: Colors.primary.hex,
        marginRight: hS(20)
    },

    timeNote: {
        fontFamily: 'Poppins-Regular',
        fontSize: hS(11),
        color: Colors.darkPrimary.hex,
        marginTop: vS(18),
        letterSpacing: .2
    }
})