import { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { AppStore } from '@store/index'
import { primaryHex, primaryRgb } from '@utils/constants/colors'
import { horizontalScale as hS, verticalScale as vS } from '@utils/responsive'
import { updateMetadata, enqueueAction } from '@store/user'
import { poundsToKilograms, kilogramsToPounds } from '@utils/fomular'
import { autoId } from '@utils/helpers'
import { NETWORK_REQUEST_FAILED } from '@utils/constants/error-message'
import { commonStyles } from '@utils/stylesheet'
import { getCurrentUTCDateV2, getCurrentUTCDatetimeV1 } from '@utils/datetimes'
import withSync from '@hocs/withSync'
import withPopupBehavior from '@hocs/withPopupBehavior'
import PrimaryToggleValue from '../primary-toggle-value'
import MeasureInput from '../measure-input'
import LinearGradient from 'react-native-linear-gradient'
import UserService from '@services/user'
import useSession from '@hooks/useSession'

const { popupButton, popupButtonBg, popupButtonText } = commonStyles
const options = ['kg', 'lb']

export default withPopupBehavior(
   withSync(({ 
      onConfirm,
      isOnline
   }: { 
      onConfirm: (afterDisappear: () => Promise<void>) => void,
      isOnline: boolean
   }) => {
      const dispatch = useDispatch()
      let { currentWeight, bodyRecords } = useSelector((state: AppStore) => state.user.metadata)
      const { userId } = useSession()
      const [ weight, setWeight ] = useState<number>(currentWeight)
      const [ selectedOptionIndex, setSelectedOptionIndex ] = useState<number>(0)

      const onSave = async () => {
         const currentDate: string = getCurrentUTCDateV2()
         const newBodyRecId: string = autoId('br')
         const value = selectedOptionIndex ? poundsToKilograms(weight) : weight
         const payload = { currentWeight: value }
         const reqPayload = { ...payload, newBodyRecId, currentDate }
         
         const cache = () => {
            dispatch(updateMetadata(payload))

            const i: number = bodyRecords.findIndex((e: any) => {
               const createdAt: Date = new Date(e.createdAt)
               return createdAt.toLocaleDateString() === currentDate && e.type === 'weight'
            })

            if (i === -1) {
               const currentDatetime: string = getCurrentUTCDatetimeV1()
               bodyRecords = [...bodyRecords, {
                  id: newBodyRecId,
                  value,
                  type: 'weight',
                  createdAt: currentDatetime,
                  updatedAt: currentDatetime
               }]
            } else bodyRecords[i].value = value

            if (userId && !isOnline) {
               dispatch(enqueueAction({
                  userId, 
                  actionId: autoId('qaid'),
                  invoker: 'updateWeight',
                  name: 'UPDATE_WEIGHT',
                  params: [userId, reqPayload]
               }))
            }
         }
         
         if (userId) {
            const errorMessage: string = await UserService.updateWeight(userId, reqPayload)
            if (errorMessage === NETWORK_REQUEST_FAILED) cache()
            return
         }
         cache()
      }

      const onChangeOption = () => {
         const convertFunc = selectedOptionIndex && kilogramsToPounds || poundsToKilograms
         setWeight(convertFunc(weight))
      }

      return (
         <>
            <PrimaryToggleValue {...{ 
               options, 
               selectedOptionIndex,
               setSelectedOptionIndex,
               onChangeOption, 
               additionalStyles: styles.toggle 
            }} />
            <MeasureInput 
               contentCentered
               symb={options[selectedOptionIndex]}
               value={weight} 
               onChangeText={t => setWeight(+t)} 
               additionalStyles={styles.input} />
            <TouchableOpacity
               onPress={() => onConfirm(onSave)}
               activeOpacity={.7}
               style={popupButton}>
               <LinearGradient
                  style={popupButtonBg}
                  colors={[`rgba(${primaryRgb.join(', ')}, .6)`, primaryHex]}
                  start={{ x: .5, y: 0 }}
                  end={{ x: .5, y: 1 }}>
                  <Text style={popupButtonText}>Save</Text>
               </LinearGradient>
            </TouchableOpacity>
         </>
      )
   }),
   'centered',
   'Current weight', 
   hS(315)
)

const styles = StyleSheet.create({
   input: {
      marginLeft: hS(20),
      height: vS(105)
   },

   toggle: {
      marginVertical: vS(8)
   }
})